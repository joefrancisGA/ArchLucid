/**
 * Staging-only Email OTP challenge flood (Evidence E1).
 *
 * Safe defaults are low VUs / short duration. Do not point at production.
 *
 * Usage:
 *   k6 run scripts/load/email-otp-challenge-flood.js -e BASE_URL=https://staging-api.example
 *   k6 run scripts/load/email-otp-challenge-flood.js -e BASE_URL=http://127.0.0.1:8080 -e VUS=8 -e DURATION=2m
 *
 * Env:
 *   BASE_URL                 API base (default http://127.0.0.1:8080)
 *   VUS                      virtual users (default 5)
 *   DURATION                 hold duration (default 2m)
 *   EXPECT_BOT_CHALLENGE     when "true", assert missing token never returns challengeId
 *   API_PREFIX               default /v1
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const baseUrl = (__ENV.BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const apiPrefix = (__ENV.API_PREFIX ?? "/v1").replace(/\/$/, "");
const expectBotChallenge = String(__ENV.EXPECT_BOT_CHALLENGE ?? "false").toLowerCase() === "true";

const challengeOk = new Counter("email_otp_challenge_http_ok");
const challengeNeutral = new Counter("email_otp_challenge_neutral_no_id");
const challengeWithId = new Counter("email_otp_challenge_with_id");
const leakSuspect = new Counter("email_otp_challenge_body_leak_suspect");
const bodySafe = new Rate("email_otp_challenge_body_safe");

export const options = {
  vus: Number(__ENV.VUS ?? 5),
  duration: __ENV.DURATION ?? "2m",
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.05", abortOnFail: false }],
    email_otp_challenge_body_safe: ["rate>0.99"],
  },
};

const FORBIDDEN_BODY_SNIPPETS = [
  "Exception",
  "StackTrace",
  "at ArchLucid.",
  "SqlException",
  "INNER JOIN",
  "DevelopmentBypass",
  "HashPepper",
  "BotChallenge:Secret",
];

function bodyLooksSafe(body) {
  if (body == null || body === "") {
    return true;
  }

  const text = String(body);

  for (const snippet of FORBIDDEN_BODY_SNIPPETS) {
    if (text.includes(snippet)) {
      return false;
    }
  }

  return true;
}

export default function emailOtpChallengeFlood() {
  const email = `flood-vu${__VU}-${__ITER}-${Date.now()}@example.com`;
  const url = `${baseUrl}${apiPrefix}/auth/email-otp/challenge`;

  const response = http.post(url, JSON.stringify({ email }), {
    headers: { "Content-Type": "application/json" },
    tags: { name: "email_otp_challenge" },
    timeout: "30s",
  });

  if (response.status >= 200 && response.status < 500) {
    challengeOk.add(1);
  }

  const safe = bodyLooksSafe(response.body);
  bodySafe.add(safe);

  if (!safe) {
    leakSuspect.add(1);
  }

  let challengeId = null;

  try {
    const parsed = response.json();
    challengeId = parsed?.challengeId ?? parsed?.ChallengeId ?? null;
  } catch {
    challengeId = null;
  }

  if (challengeId) {
    challengeWithId.add(1);
  } else {
    challengeNeutral.add(1);
  }

  check(response, {
    "status is not 5xx": (r) => r.status < 500,
    "status is 200, 404, or 429": (r) =>
      r.status === 200 || r.status === 404 || r.status === 429,
    "body has no internal leak snippets": () => safe,
    "bot challenge denies challengeId when expected": () => {
      if (!expectBotChallenge) {
        return true;
      }

      // Missing Turnstile token must not mint a usable challenge under RequireBotChallenge.
      return challengeId == null || challengeId === "";
    },
  });

  sleep(0.2 + Math.random() * 0.3);
}
