import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";

export const ALERT_TUNING_KIND_PARAM = "tuneKind";
export const ALERT_TUNING_THRESHOLDS_PARAM = "tuneThresholds";
export const ALERT_TUNING_RUN_SLUG_PARAM = "tuneRunSlug";

export type AlertTuningFormDraftUrlState = {
  readonly ruleKind: "Simple" | "Composite" | null;
  readonly candidateThresholds: string | null;
  readonly runSlug: string | null;
};

const ALERT_TUNING_KIND_IDS = new Set<string>(["Simple", "Composite"]);

export function parseAlertTuningKindFromSearch(raw: string | null | undefined): "Simple" | "Composite" | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (!ALERT_TUNING_KIND_IDS.has(trimmed)) {
    return null;
  }

  return trimmed as "Simple" | "Composite";
}

export function parseAlertTuningThresholdsFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function parseAlertTuningRunSlugFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "";
  }

  return raw.trim();
}

export function alertTuningFormDraftHrefFromSearch(
  currentSearch: string,
  state: AlertTuningFormDraftUrlState,
  pathname: string = GOVERNANCE_ALERT_RULES_PATH,
): string {
  const params = new URLSearchParams(currentSearch);
  const thresholds = (state.candidateThresholds ?? "").trim();
  const runSlug = (state.runSlug ?? "").trim();

  if (state.ruleKind === null) {
    params.delete(ALERT_TUNING_KIND_PARAM);
  } else {
    params.set(ALERT_TUNING_KIND_PARAM, state.ruleKind);
  }

  if (thresholds.length === 0) {
    params.delete(ALERT_TUNING_THRESHOLDS_PARAM);
  } else {
    params.set(ALERT_TUNING_THRESHOLDS_PARAM, thresholds);
  }

  if (runSlug.length === 0) {
    params.delete(ALERT_TUNING_RUN_SLUG_PARAM);
  } else {
    params.set(ALERT_TUNING_RUN_SLUG_PARAM, runSlug);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
