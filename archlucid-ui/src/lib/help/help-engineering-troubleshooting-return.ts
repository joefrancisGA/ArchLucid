import { ENGINEERING_TROUBLESHOOTING_HELP_PATH } from "@/lib/developer-troubleshooting-help-route";

export const ENGINEERING_TROUBLESHOOTING_HELP_RETURN_QUERY_PARAM = "returnTo" as const;

export const ENGINEERING_TROUBLESHOOTING_HELP_RETURN_LABEL =
  "Back to engineering troubleshooting runbook" as const;

/** Canonical return target for related-guide handoffs. */
export function buildEngineeringTroubleshootingHelpReturnTo(): string {
  return ENGINEERING_TROUBLESHOOTING_HELP_PATH;
}

/** Append a same-origin returnTo query for guides that support resume links. */
export function buildEngineeringTroubleshootingRelatedGuideHref(href: string): string {
  const trimmed = href.trim();

  if (trimmed.length === 0) {
    return ENGINEERING_TROUBLESHOOTING_HELP_PATH;
  }

  const separator = trimmed.includes("?") ? "&" : "?";

  return `${trimmed}${separator}${ENGINEERING_TROUBLESHOOTING_HELP_RETURN_QUERY_PARAM}=${encodeURIComponent(ENGINEERING_TROUBLESHOOTING_HELP_PATH)}`;
}
