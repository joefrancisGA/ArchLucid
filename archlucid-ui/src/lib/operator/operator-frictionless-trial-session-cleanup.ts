import {
  FRICTIONLESS_TRIAL_SESSION_CHANGED_EVENT,
  readFrictionlessTrialSessionEnabled,
  writeFrictionlessTrialSessionEnabled,
} from "@/lib/frictionless-trial-session";
import { isLikelySignedIn } from "@/lib/oidc/session";

/** Clears the marketing frictionless-trial flag once the visitor is an authenticated operator. */
export function clearFrictionlessTrialSessionForAuthenticatedOperator(): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!isLikelySignedIn()) {
    return;
  }

  if (!readFrictionlessTrialSessionEnabled()) {
    return;
  }

  writeFrictionlessTrialSessionEnabled(false);
  window.dispatchEvent(new Event(FRICTIONLESS_TRIAL_SESSION_CHANGED_EVENT));
}
