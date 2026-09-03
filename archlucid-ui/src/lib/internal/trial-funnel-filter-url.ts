import { INTERNAL_TRIAL_FUNNEL_PATH } from "@/lib/internal-ops-route-paths";
import type { TrialFunnelPeriodDays } from "@/lib/trial-funnel-metric-contract";

export const TRIAL_FUNNEL_RANGE_PARAM = "range";
export const TRIAL_FUNNEL_STAGE_PARAM = "stage";

export const DEFAULT_TRIAL_FUNNEL_PERIOD_DAYS: TrialFunnelPeriodDays = 30;

const PERIOD_IDS = new Set<string>(["7", "30", "90"]);
const STAGE_IDS = new Set<string>([
  "trial-started",
  "first-review-finalized",
  "checkout-activity",
  "converted",
]);

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
  const params = new URLSearchParams(currentSearch);

  if (periodDays === DEFAULT_TRIAL_FUNNEL_PERIOD_DAYS) {
    params.delete(TRIAL_FUNNEL_RANGE_PARAM);
  } else {
    params.set(TRIAL_FUNNEL_RANGE_PARAM, String(periodDays));
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}

export function trialFunnelStageHrefFromSearch(
  currentSearch: string,
  stage: string,
  pathname: string = INTERNAL_TRIAL_FUNNEL_PATH,
): string {
  const params = new URLSearchParams(currentSearch);

  if (stage === "all") {
    params.delete(TRIAL_FUNNEL_STAGE_PARAM);
  } else {
    params.set(TRIAL_FUNNEL_STAGE_PARAM, stage);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
