/**
 * Staging-only self-service registration farm stub (Evidence E1 — farm half).
 *
 * Requires Auth:PublicSignup:Mode=PublicSelfService for this drill only.
 * Do not run against production.
 *
 * Usage:
 *   k6 run scripts/load/self-service-trial-farm-stub.js -e BASE_URL=https://staging-api.example
 *
 * Env:
 *   BASE_URL     API base (default http://127.0.0.1:8080)
 *   VUS          virtual users (default 3)
 *   DURATION     duration (default 1m)
 *   EMAIL_DOMAIN shared domain for velocity (default farm.example)
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const baseUrl = (__ENV.BASE_URL ?? "http://127.0.0.1:8080").replace(/\/$/, "");
const emailDomain = __ENV.EMAIL_DOMAIN ?? "farm.example";

const registerAttempts = new Counter("trial_farm_register_attempts");
const registerDenied = new Counter("trial_farm_register_denied");
const bodySafe = new Rate("trial_farm_body_safe");

export const options = {
  vus: Number(__ENV.VUS ?? 3),
  duration: __ENV.DURATION ?? "1m",
  thresholds: {
    trial_farm_body_safe: ["rate>0.99"],
  },
};

const FORBIDDEN_BODY_SNIPPETS = [
  "Exception",
  "StackTrace",
  "at ArchLucid.",
  "SqlException",
  "DevelopmentBypass",
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

export default function selfServiceTrialFarmStub() {
  const stamp = `${__VU}-${__ITER}-${Date.now()}`;
  const email = `user-${stamp}@${emailDomain}`;
  const org = `Farm Org ${stamp}`;

  const payload = JSON.stringify({
    organizationName: org,
    adminEmail: email,
    companySize: "1-10",
    industry: "Technology",
  });

  const response = http.post(`${baseUrl}/v1/register`, payload, {
    headers: { "Content-Type": "application/json" },
    tags: { name: "register_farm" },
    timeout: "45s",
  });

  registerAttempts.add(1);

  const safe = bodyLooksSafe(response.body);
  bodySafe.add(safe);

  // Invite-only → 404; abuse deny → 4xx; success → 2xx. All must stay buyer-safe.
  if (response.status === 404 || (response.status >= 400 && response.status < 500)) {
    registerDenied.add(1);
  }

  check(response, {
    "status is not 5xx": (r) => r.status < 500,
    "body has no internal leak snippets": () => safe,
  });

  sleep(0.5 + Math.random() * 0.5);
}
