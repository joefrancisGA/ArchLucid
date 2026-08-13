/**
 * Query-string tab ids for the `/governance/alert-rules` hub (`?tab=`). **rules** is the default when the param is absent or unknown.
 */
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";

export const ALERT_HUB_TAB_IDS = ["inbox", "rules", "notifications", "advanced-rules", "test-alerts"] as const;
export type AlertHubTabId = (typeof ALERT_HUB_TAB_IDS)[number];

export const ALERT_RULES_HUB_TAB_PARAM = "tab" as const;
export const ALERT_RULES_HUB_TAB_IDS = ["rules", "notifications", "advanced-rules", "test-alerts"] as const;
export type AlertRulesHubTabId = (typeof ALERT_RULES_HUB_TAB_IDS)[number];

const ALERT_RULES_TAB_SET = new Set<string>(ALERT_RULES_HUB_TAB_IDS);

/**
 * Maps a raw `?tab=` value to a known alert-rules hub id.
 * Returns null when the value is not a configuration tab.
 */
export function canonicalizeAlertRulesHubTabParam(param: string): AlertRulesHubTabId | null {
  if (ALERT_RULES_TAB_SET.has(param)) {
    return param as AlertRulesHubTabId;
  }

  return null;
}

/**
 * Resolves the active hub tab from `?tab=`; unknown values fall back to **inbox**.
 */
export function alertHubTabFromSearchParam(param: string | null): AlertHubTabId {
  if (param === null || param === "") {
    return "inbox";
  }

  if (param === "inbox") {
    return "inbox";
  }

  const configurationTab = canonicalizeAlertRulesHubTabParam(param);

  if (configurationTab !== null) {
    return configurationTab;
  }

  return "inbox";
}

/** Resolves the active alert-rules hub tab; unknown values fall back to **rules**. */
export function alertRulesHubTabFromSearchParam(param: string | null): AlertRulesHubTabId {
  if (param === null || param === "") {
    return "rules";
  }

  const canonical = canonicalizeAlertRulesHubTabParam(param);

  if (canonical !== null) {
    return canonical;
  }

  return "rules";
}

/** True when a `/governance/alerts?tab=` value targets rule configuration, not the inbox. */
export function isAlertConfigurationTabParam(param: string | null | undefined): boolean {
  if (param === null || param === undefined || param === "" || param === "inbox") {
    return false;
  }

  return canonicalizeAlertRulesHubTabParam(param) !== null;
}

/** Reads the active alert-rules hub tab from the current browser location. */
export function readAlertRulesHubTabFromWindowLocation(): AlertRulesHubTabId {
  if (typeof window === "undefined") {
    return "rules";
  }

  return alertRulesHubTabFromSearchParam(
    new URLSearchParams(window.location.search).get(ALERT_RULES_HUB_TAB_PARAM),
  );
}

/** Updates `?tab=` in the address bar without a Next.js soft navigation. */
export function writeAlertRulesHubTabToUrl(tab: AlertRulesHubTabId): void {
  if (typeof window === "undefined") {
    return;
  }

  const href = governanceAlertRulesTabHref(tab);
  const url = new URL(href, window.location.origin);

  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}
