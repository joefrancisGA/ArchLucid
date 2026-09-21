import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";

const LIVE_SEAT_SCOPE_LANDING_KEY = "archlucid.liveSeat.scopeLandingTelemetry";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Coarse scope landing — at most once per browser tab session (LS-017). */
export function recordLiveSeatScopeLandingOnce(isSampleScope: boolean): void {
  if (!isBrowser()) {
    return;
  }

  try {
    if (window.sessionStorage.getItem(LIVE_SEAT_SCOPE_LANDING_KEY) === "1") {
      return;
    }

    window.sessionStorage.setItem(LIVE_SEAT_SCOPE_LANDING_KEY, "1");
  } catch {
    /* sessionStorage unavailable */
  }

  recordFirstTenantFunnelEvent(
    isSampleScope ? "post_auth_landed_sample_scope" : "post_auth_landed_dedicated_scope",
  );
}

export function recordFirstSessionPurposeChosen(purpose: "live" | "training"): void {
  recordFirstTenantFunnelEvent(
    purpose === "training" ? "first_session_purpose_training" : "first_session_purpose_live",
  );
}
