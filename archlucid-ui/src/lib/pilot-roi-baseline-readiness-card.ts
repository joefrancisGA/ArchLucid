export const PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_SESSION_KEY =
  "archlucid-pilot-roi-baseline-readiness-card-dismissed-session";

export function isPilotRoiBaselineReadinessCardDismissedForSession(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.sessionStorage.getItem(PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissPilotRoiBaselineReadinessCardForSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(PILOT_ROI_BASELINE_READINESS_CARD_DISMISSED_SESSION_KEY, "1");
  } catch {
    /* private mode quota */
  }
}
