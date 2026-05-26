/** Threshold triggers for the trial usage upgrade nudge (Improvement #14). */
export type TrialUpgradeNudgeTrigger = "runs" | "seats" | "expiry";

export type TrialUpgradeNudgeStatusPayload = {
  status?: string;
  daysRemaining?: number | null;
  trialRunsUsed?: number;
  trialRunsLimit?: number | null;
  trialSeatsUsed?: number;
  trialSeatsLimit?: number | null;
};

const RUNS_USAGE_THRESHOLD = 0.7;
const SEATS_USAGE_THRESHOLD = 0.8;
const EXPIRY_URGENT_DAYS_MAX = 3;

/** Returns the highest-priority active trigger, or null when no nudge threshold is met. */
export function resolveTrialUpgradeNudgeTrigger(
  payload: TrialUpgradeNudgeStatusPayload | null,
): TrialUpgradeNudgeTrigger | null {
  if (payload === null) {
    return null;
  }

  if (payload.status === "Expired" || payload.status === "ReadOnly") {
    return "expiry";
  }

  if (payload.status !== "Active") {
    return null;
  }

  const days = payload.daysRemaining;

  if (typeof days === "number" && days >= 0 && days <= EXPIRY_URGENT_DAYS_MAX) {
    return "expiry";
  }

  const runsLimit = payload.trialRunsLimit;

  if (typeof runsLimit === "number" && runsLimit > 0) {
    const runsUsed = payload.trialRunsUsed ?? 0;

    if (runsUsed / runsLimit >= RUNS_USAGE_THRESHOLD) {
      return "runs";
    }
  }

  const seatsLimit = payload.trialSeatsLimit;

  if (typeof seatsLimit === "number" && seatsLimit > 0) {
    const seatsUsed = payload.trialSeatsUsed ?? 0;

    if (seatsUsed / seatsLimit >= SEATS_USAGE_THRESHOLD) {
      return "seats";
    }
  }

  return null;
}

export function buildTrialUpgradeNudgePricingHref(trigger: TrialUpgradeNudgeTrigger): string {
  return `/pricing?source=trial-nudge&trigger=${encodeURIComponent(trigger)}#pricing-quote-request`;
}
