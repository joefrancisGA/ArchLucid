export const PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY =
  "archlucid-pilot-roi-baseline-readiness-card-dismissed";

/** @deprecated Use {@link PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY}. */
export const PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_SESSION_KEY =
  PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY;

export function isPilotRoiBaselineReadinessCardDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/** @deprecated Use {@link isPilotRoiBaselineReadinessCardDismissed}. */
export function isPilotRoiBaselineReadinessCardDismissedForSession(): boolean {
  return isPilotRoiBaselineReadinessCardDismissed();
}

export function dismissPilotRoiBaselineReadinessCard(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_KEY, "1");
  } catch {
    /* private mode quota */
  }
}

/** @deprecated Use {@link dismissPilotRoiBaselineReadinessCard}. */
export function dismissPilotRoiBaselineReadinessCardForSession(): void {
  dismissPilotRoiBaselineReadinessCard();
}
