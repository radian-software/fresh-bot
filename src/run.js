import { Octokit } from "@octokit/action";
import { throttling } from "@octokit/plugin-throttling";
import moment from "moment";
import dotenv from "dotenv-safe";

import { isBot, commentUrlParamsRegex } from "./utils/utils.js";
import { config, devEnv } from "./config/config.js";

if (devEnv()) {
  dotenv.config();
}

const ThrottledOctokit = Octokit.plugin(throttling);

export async function run() {
  const octokit = new ThrottledOctokit({
    throttle: {
      onRateLimit: (retryAfter, options) => {
        console.error(
          `Request quota exhausted for request ${options.method} ${options.url}, number of total global retries: ${options.request.retryCount}`
        );

        console.log(`Retrying after ${retryAfter} seconds!`);

        return config.retriesEnabled;
      },
      onSecondaryRateLimit: (retryAfter, options) => {
        console.error(
          `Hit secondary rate limit for request ${options.method} ${options.url}, number of total global retries: ${options.request.retryCount}`
        );

        console.log(`Retrying after ${retryAfter} seconds!`);

        return config.retriesEnabled;
      },
      onAbuseLimit: (retryAfter, options) => {
        console.error(
          `Abuse detected for request ${options.method} ${options.url}, retry count: ${options.request.retryCount}`
        );

        console.log(`Retrying after ${retryAfter} seconds!`);

        return config.retriesEnabled;
      },
    },
  });

  const notificationsRequest =
    octokit.activity.listNotificationsForAuthenticatedUser.endpoint.merge({
      all: true,
      since: moment().subtract(7, "days").toISOString(),
    });

  return octokit.paginate(notificationsRequest).then((notifications) => {
    const promises = notifications.map((notification) => {
      const { latest_comment_url: latestCommentUrl } = notification.subject;
      const { url: subjectUrl, title: subject } = notification.subject;

      if (!latestCommentUrl || !subjectUrl) {
        return new Promise((resolve) => {
          console.log("Missing latest comment or subject url");

          resolve();
        });
      }

      return octokit
        .request(latestCommentUrl)
        .then(({ data }) => {
          const releaseNotification = data.author && !data.user;

          if (releaseNotification) {
            return Promise.resolve();
          }

          if (!isBot(data)) {
            return new Promise((resolve) => {
              console.log(
                "Comment for",
                latestCommentUrl,
                "is not left by a stale bot on issue",
                subject
              );

              resolve();
            });
          }

          console.log(
            "Found stale bot comment",
            latestCommentUrl,
            "on issue",
            subject
          );

          if (devEnv()) {
            return new Promise((resolve) => {
              console.log(
                "Responding to stale bot comments is disabled in development environment."
              );

              resolve();
            });
          }

          const commentParams = commentUrlParamsRegex.exec(subjectUrl);

          return octokit.issues.createComment({
            ...commentParams.groups,
            body: config.message,
          });
        })
        .catch((err) => {
          if (err.status === 404) {
            console.log(
              "Comment for",
              latestCommentUrl,
              "appears to be in a private repository we don't have access to"
            );
          } else {
            throw err;
          }
        });
    });

    return Promise.all(promises);
  });
}
