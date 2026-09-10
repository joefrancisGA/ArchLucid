/**
 * Email-OTP live E2E lane helpers. The jwt-bearer private-beta push workflow does not enable OTP;
 * a dedicated lane needs UI + API flags and a challenge-code capture sink.
 */

/** Env var for a harness-injected OTP when an API capture endpoint exists (future). */
export const LIVE_E2E_EMAIL_OTP_CHALLENGE_CODE_ENV = "LIVE_E2E_EMAIL_OTP_CHALLENGE_CODE";

export function isLiveEmailOtpLaneConfigured(): boolean {
  const uiEnabled = process.env.NEXT_PUBLIC_ARCHLUCID_EMAIL_OTP_ENABLED?.trim().toLowerCase() === "true";
  const apiEnabled = process.env.AUTH_EMAIL_OTP_ENABLED?.trim().toLowerCase() === "true"
    || process.env.Auth__EmailOtp__Enabled?.trim().toLowerCase() === "true";
  const challengeCode = process.env[LIVE_E2E_EMAIL_OTP_CHALLENGE_CODE_ENV]?.trim() ?? "";

  return uiEnabled && apiEnabled && challengeCode.length > 0;
}

export function liveEmailOtpLaneSkipReason(): string {
  return [
    "Email-OTP invite E2E needs NEXT_PUBLIC_ARCHLUCID_EMAIL_OTP_ENABLED=true,",
    "Auth:EmailOtp:Enabled (or AUTH_EMAIL_OTP_ENABLED=true),",
    `and ${LIVE_E2E_EMAIL_OTP_CHALLENGE_CODE_ENV} from a challenge-code capture harness`,
    "— not wired in private-beta-access-on-push.yml.",
  ].join(" ");
}

export function requireLiveEmailOtpChallengeCode(): string {
  const challengeCode = process.env[LIVE_E2E_EMAIL_OTP_CHALLENGE_CODE_ENV]?.trim() ?? "";

  if (challengeCode.length === 0) {
    throw new Error(
      `Set ${LIVE_E2E_EMAIL_OTP_CHALLENGE_CODE_ENV} to the captured OTP for the active email-OTP lane.`,
    );
  }

  return challengeCode;
}
