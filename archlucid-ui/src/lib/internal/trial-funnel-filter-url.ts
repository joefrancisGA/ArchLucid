import { INTERNAL_TRIAL_FUNNEL_PATH } from "@/lib/internal-ops-route-paths";
import type { TrialFunnelPeriodDays } from "@/lib/trial-funnel-metric-contract";
import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const TRIAL_FUNNEL_RANGE_PARAM = "range";
export const TRIAL_FUNNEL_STAGE_PARAM = "stage";
export const TRIAL_FUNNEL_ATTENTION_PARAM = "attention";
export const TRIAL_FUNNEL_COMPARE_PARAM = "compare";
export const TRIAL_FUNNEL_SORT_PARAM = "sort";
export const TRIAL_FUNNEL_SORT_DIR_PARAM = "dir";

export type TrialFunnelCohortSortKey =
  | "organizationName"
  | "trialStartedUtc"
  | "currentStageLabel"
  | "daysInTrial"
  | "lastMeaningfulActivityUtc"
  | "firstReviewStatus"
  | "conversionStatus"
  | "estimatedFirstReviewCostUsd";

export const DEFAULT_TRIAL_FUNNEL_PERIOD_DAYS: TrialFunnelPeriodDays = 30;

const PERIOD_IDS = new Set<string>(["7", "30", "90"]);
const STAGE_IDS = new Set<string>([
  "trial-started",
  "first-review-finalized",
  "checkout-activity",
  "converted",
]);
const SORT_KEY_IDS = new Set<string>([
  "organizationName",
  "trialStartedUtc",
  "currentStageLabel",
  "daysInTrial",
  "lastMeaningfulActivityUtc",
  "firstReviewStatus",
  "conversionStatus",
  "estimatedFirstReviewCostUsd",
]);
const SORT_DIR_IDS = new Set<string>(["asc", "desc"]);

export const DEFAULT_TRIAL_FUNNEL_COHORT_SORT_KEY: TrialFunnelCohortSortKey = "trialStartedUtc";
export const DEFAULT_TRIAL_FUNNEL_COHORT_SORT_ASC = false;

export function parseTrialFunnelPeriodDaysFromSearch(raw: string | null | undefined): TrialFunnelPeriodDays {
  if (raw === null || raw === undefined) {
    return DEFAULT_TRIAL_FUNNEL_PERIOD_DAYS;
  }

  const trimmed = raw.trim();

  if (!PERIOD_IDS.has(trimmed)) {
    return DEFAULT_TRIAL_FUNNEL_PERIOD_DAYS;
  }

  return Number.parseInt(trimmed, 10) as TrialFunnelPeriodDays;
}

export function parseTrialFunnelStageFromSearch(raw: string | null | undefined): string {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!STAGE_IDS.has(trimmed)) {
    return "all";
  }

  return trimmed;
}

export function trialFunnelPeriodHrefFromSearch(
  currentSearch: string,
  periodDays: TrialFunnelPeriodDays,
  pathname: string = INTERNAL_TRIAL_FUNNEL_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (periodDays === DEFAULT_TRIAL_FUNNEL_PERIOD_DAYS) {
      params.delete(TRIAL_FUNNEL_RANGE_PARAM);
    } else {
      params.set(TRIAL_FUNNEL_RANGE_PARAM, String(periodDays));
    }
    },
  });
}

export function trialFunnelStageHrefFromSearch(
  currentSearch: string,
  stage: string,
  pathname: string = INTERNAL_TRIAL_FUNNEL_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (stage === "all") {
      params.delete(TRIAL_FUNNEL_STAGE_PARAM);
    } else {
      params.set(TRIAL_FUNNEL_STAGE_PARAM, stage);
    }
    },
  });
}

export function parseTrialFunnelAttentionOnlyFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseTrialFunnelComparePreviousFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim().toLowerCase();

  return trimmed === "1" || trimmed === "true";
}

export function parseTrialFunnelCohortSortKeyFromSearch(
  raw: string | null | undefined,
): TrialFunnelCohortSortKey {
  if (raw === null || raw === undefined) {
    return DEFAULT_TRIAL_FUNNEL_COHORT_SORT_KEY;
  }

  const trimmed = raw.trim();

  if (!SORT_KEY_IDS.has(trimmed)) {
    return DEFAULT_TRIAL_FUNNEL_COHORT_SORT_KEY;
  }

  return trimmed as TrialFunnelCohortSortKey;
}

export function parseTrialFunnelCohortSortAscFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return DEFAULT_TRIAL_FUNNEL_COHORT_SORT_ASC;
  }

  const trimmed = raw.trim().toLowerCase();

  if (!SORT_DIR_IDS.has(trimmed)) {
    return DEFAULT_TRIAL_FUNNEL_COHORT_SORT_ASC;
  }

  return trimmed === "asc";
}

export function trialFunnelAttentionHrefFromSearch(
  currentSearch: string,
  attentionOnly: boolean,
  pathname: string = INTERNAL_TRIAL_FUNNEL_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!attentionOnly) {
      params.delete(TRIAL_FUNNEL_ATTENTION_PARAM);
    } else {
      params.set(TRIAL_FUNNEL_ATTENTION_PARAM, "1");
    }
    },
  });
}

export function trialFunnelCompareHrefFromSearch(
  currentSearch: string,
  comparePrevious: boolean,
  pathname: string = INTERNAL_TRIAL_FUNNEL_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (!comparePrevious) {
      params.delete(TRIAL_FUNNEL_COMPARE_PARAM);
    } else {
      params.set(TRIAL_FUNNEL_COMPARE_PARAM, "1");
    }
    },
  });
}

export function trialFunnelCohortSortHrefFromSearch(
  currentSearch: string,
  sortKey: TrialFunnelCohortSortKey,
  sortAsc: boolean,
  pathname: string = INTERNAL_TRIAL_FUNNEL_PATH,
): string {
  return buildOperatorHrefFromSearch(currentSearch, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: (params) => {

    if (sortKey === DEFAULT_TRIAL_FUNNEL_COHORT_SORT_KEY) {
      params.delete(TRIAL_FUNNEL_SORT_PARAM);
    } else {
      params.set(TRIAL_FUNNEL_SORT_PARAM, sortKey);
    }

    if (sortAsc === DEFAULT_TRIAL_FUNNEL_COHORT_SORT_ASC) {
      params.delete(TRIAL_FUNNEL_SORT_DIR_PARAM);
    } else {
      params.set(TRIAL_FUNNEL_SORT_DIR_PARAM, sortAsc ? "asc" : "desc");
    }
    },
  });
}
