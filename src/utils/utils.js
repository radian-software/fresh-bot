/* eslint-disable prefer-regex-literals */
export function isBot(commentData) {
  const userTypeRegex = /^Bot$/;
  const bodyRegexes = [
    new RegExp("This issue has been automatically marked as stale"),
    new RegExp("This issue hasn't had any recent activity"),
    // GitHub's built-in stale workflow phrasing
    new RegExp("This issue has been inactive for \\d+ days"),
    // Kubernetes
    new RegExp("lifecycle stale"),
  ];
  const loginRegexes = [/^.+-bot$/, /^.+-robot$/];

  const { login, type } = commentData.user;
  const { body } = commentData;

  const userMatch = userTypeRegex.test(type);
  const bodyMatch = bodyRegexes.some((bodyRegex) => bodyRegex.test(body));
  const loginMatch = loginRegexes.some((loginRegex) => loginRegex.test(login));

  return (userMatch || loginMatch) && bodyMatch;
}

export const commentUrlParamsRegex = new RegExp(
  "(?:https://)(?:api.github.com)/(?:repos)/(?<owner>[\\w-]+)/(?<repo>[\\w-]+)/(?:issues)/(?<issue_number>[0-9]+)"
);
