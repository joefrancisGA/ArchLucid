/** Session flag other pilot surfaces may read to infer “baseline ZIP applied” in this session. */
const SESSION_KEY = "archlucid.pilotSignals.baselineZipApplied.v1";

/** Dispatched on `window` when a packager ZIP is successfully parsed in the new-run wizard (baseline path). */
export const PILOT_BASELINE_ZIP_APPLIED_EVENT = "archlucid-pilot-baseline-zip-applied";

export function recordPilotBaselineZipApplied(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(SESSION_KEY, new Date().toISOString());
  } catch {
    /* sessionStorage may be unavailable */
  }

  try {
    window.dispatchEvent(new CustomEvent(PILOT_BASELINE_ZIP_APPLIED_EVENT));
  } catch {
    /* ignore */
  }
}
