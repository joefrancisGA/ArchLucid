import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";

export const COMPOSITE_ALERT_RULES_CREATE_PARAM = "create";
export const COMPOSITE_ALERT_RULES_CREATE_CONFIRM_PARAM = "compositeCreateConfirm";

export function parseCompositeAlertRulesCreatePanelFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseCompositeAlertRulesCreateConfirmOpenFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function compositeAlertRulesPanelsHrefFromSearch(
  currentSearch: string,
  patch: { readonly showCreatePanel?: boolean; readonly showCreateConfirm?: boolean },
  pathname: string = GOVERNANCE_ALERT_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.showCreatePanel !== undefined) {
    if (!patch.showCreatePanel) {
      params.delete(COMPOSITE_ALERT_RULES_CREATE_PARAM);
    } else {
      params.set(COMPOSITE_ALERT_RULES_CREATE_PARAM, "1");
    }
  }

  if (patch.showCreateConfirm !== undefined) {
    if (!patch.showCreateConfirm) {
      params.delete(COMPOSITE_ALERT_RULES_CREATE_CONFIRM_PARAM);
    } else {
      params.set(COMPOSITE_ALERT_RULES_CREATE_CONFIRM_PARAM, "1");
    }
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
