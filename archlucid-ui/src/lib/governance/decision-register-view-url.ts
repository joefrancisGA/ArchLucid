import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";

import type { DecisionRegisterViewMode } from "@/app/(operator)/governance/decision-register/DecisionRegisterViewSwitcher";

export const DECISION_REGISTER_VIEW_PARAM = "view";

const VIEW_MODE_IDS = new Set<string>(["cards", "timeline"]);

export const DEFAULT_DECISION_REGISTER_VIEW_MODE: DecisionRegisterViewMode = "cards";

export function parseDecisionRegisterViewModeFromSearch(
  raw: string | null | undefined,
): DecisionRegisterViewMode {
  if (raw === null || raw === undefined) {
    return DEFAULT_DECISION_REGISTER_VIEW_MODE;
  }

  const trimmed = raw.trim();

  if (!VIEW_MODE_IDS.has(trimmed)) {
    return DEFAULT_DECISION_REGISTER_VIEW_MODE;
  }

  return trimmed as DecisionRegisterViewMode;
}

export function decisionRegisterViewModeHrefFromSearch(
  currentSearch: string,
  viewMode: DecisionRegisterViewMode,
  pathname: string = GOVERNANCE_DECISION_REGISTER_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (viewMode === DEFAULT_DECISION_REGISTER_VIEW_MODE) {
    params.delete(DECISION_REGISTER_VIEW_PARAM);
  } else {
    params.set(DECISION_REGISTER_VIEW_PARAM, viewMode);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
