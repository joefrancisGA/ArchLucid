/** DW-007 — help/diagnostics: edge proxy timeout vs Career Real execute. */
export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_SLUG = "proxy-timeout-real-execute" as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_TITLE = "Proxy timeout vs Real execute" as const;

export const DAYTIME_WAIT_HELP_PROXY_TIMEOUT_OVERVIEW =
  "Front Door and similar edge proxies may close idle connections around 45–60 seconds. Career Real execute on Working returns 202 Accepted with an operation id — the UI polls GET /v1/operations/{operationId}. A sync timeout is not proof the review failed; check Activity and the shell in-flight strip before retrying." as const;
