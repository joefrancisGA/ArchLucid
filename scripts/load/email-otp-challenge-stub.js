/**
 * Compatibility entrypoint for EMAIL_OTP_DELIVERY_AND_ABUSE.md § Abuse drill.
 * Implementation lives in email-otp-challenge-flood.js (same options / default).
 *
 * Usage: k6 run scripts/load/email-otp-challenge-stub.js -e BASE_URL=https://staging.example
 */

import flood, { options as floodOptions } from "./email-otp-challenge-flood.js";

export const options = floodOptions;

export default function emailOtpChallengeStub() {
  return flood();
}
