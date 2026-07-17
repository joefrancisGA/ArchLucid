import http from "k6/http";
import { check, sleep } from "k6";

/**
 * Staging-only OTP challenge flood stub. Safe defaults: low VUs, short duration.
 * Usage: k6 run scripts/load/email-otp-challenge-stub.js -e BASE_URL=https://staging.example
 */
const baseUrl = (__ENV.BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

export const options = {
  vus: Number(__ENV.VUS ?? 3),
  duration: __ENV.DURATION ?? "30s",
};

export default function emailOtpChallengeStub() {
  const email = `load-${__VU}-${Date.now()}@example.com`;

  const response = http.post(
    `${baseUrl}/v1/auth/email-otp/challenge`,
    JSON.stringify({ email }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(response, {
    "status is 200 or 404": (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);
}
