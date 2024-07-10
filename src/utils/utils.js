export function isBot(commentData) {
  const userTypeRegex = /^Bot$/;
  const bodyRegexes = [
    /This issue has been automatically marked as stale/,
    /This issue hasn't had any recent activity/,
    /lifecycle stale/,
  ];
  const loginRegexes = [/^.+-bot$/, /^.+-robot$/];

  const { login, type } = commentData.user;
  const { body } = commentData;

  const userMatch = userTypeRegex.test(type);
  const bodyMatch = bodyRegexes.some((bodyRegex) => bodyRegex.test(body));
  const loginMatch = loginRegexes.some((loginRegex) => loginRegex.test(login));

  return (userMatch || loginMatch) && bodyMatch;
}

// eslint-disable-next-line prefer-regex-literals
export const commentUrlParamsRegex = new RegExp(
  "(?:https://)(?:api.github.com)/(?:repos)/(?<owner>[\\w-]+)/(?<repo>[\\w-]+)/(?:issues)/(?<issue_number>[0-9]+)"
);
