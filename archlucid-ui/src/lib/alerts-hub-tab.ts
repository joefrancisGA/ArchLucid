/**
 * Query-string tab ids for the `/governance/alert-rules` hub (`?tab=`). **rules** is the default when the param is absent or unknown.
 */
export const ALERT_HUB_TAB_IDS = ["inbox", "rules", "routing", "composite", "simulation"] as const;
export type AlertHubTabId = (typeof ALERT_HUB_TAB_IDS)[number];

export const ALERT_RULES_HUB_TAB_IDS = ["rules", "routing", "composite", "simulation"] as const;
export type AlertRulesHubTabId = (typeof ALERT_RULES_HUB_TAB_IDS)[number];

const TAB_SET = new Set<string>(ALERT_HUB_TAB_IDS);
const ALERT_RULES_TAB_SET = new Set<string>(ALERT_RULES_HUB_TAB_IDS);

/**
 * Resolves the active hub tab from `?tab=`; unknown values fall back to **inbox**.
 */
export function alertHubTabFromSearchParam(param: string | null): AlertHubTabId {
  if (param === null || param === "") {
    return "inbox";
  }

  if (TAB_SET.has(param)) {
    return param as AlertHubTabId;
  }

  return "inbox";
}

/** Resolves the active alert-rules hub tab; unknown values fall back to **rules**. */
export function alertRulesHubTabFromSearchParam(param: string | null): AlertRulesHubTabId {
  if (param === null || param === "") {
    return "rules";
  }

  if (ALERT_RULES_TAB_SET.has(param)) {
    return param as AlertRulesHubTabId;
  }

  return "rules";
}

/** True when a legacy `/governance/alerts?tab=` value targets rule configuration, not the inbox. */
export function isAlertConfigurationTabParam(param: string | null | undefined): boolean {
  if (param === null || param === undefined || param === "" || param === "inbox") {
    return false;
  }

  return ALERT_RULES_TAB_SET.has(param);
}

