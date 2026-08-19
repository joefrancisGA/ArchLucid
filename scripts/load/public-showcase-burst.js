/**
 * Anonymous marketing/showcase burst — ramps read-only UI routes that must stay static (no live LLM).
 *
 * Usage:
 *   k6 run scripts/load/public-showcase-burst.js
 *   k6 run -e ARCHLUCID_UI_BASE_URL=http://127.0.0.1:3000 -e K6_SHOWCASE_PEAK_VUS=100 scripts/load/public-showcase-burst.js
 *
 * Env:
 *   ARCHLUCID_UI_BASE_URL   (default http://127.0.0.1:3000)
 *   K6_SHOWCASE_PEAK_VUS     peak virtual users (default 50)
 *   K6_SHOWCASE_RAMP         ramp-up duration (default 2m)
 *   K6_SHOWCASE_HOLD         plateau duration (default 3m)
 */

import http from "k6/http";
import { check, sleep } from "k6";

const base = (__ENV.ARCHLUCID_UI_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const peakVus = Number(__ENV.K6_SHOWCASE_PEAK_VUS || 50);
const rampDuration = __ENV.K6_SHOWCASE_RAMP || "2m";
const holdDuration = __ENV.K6_SHOWCASE_HOLD || "3m";

const showcasePaths = [
  "/showcase/claims-intake-modernization",
  "/see-it",
  "/welcome",
];

export const options = {
  scenarios: {
    public_showcase_burst: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: rampDuration, target: peakVus },
        { duration: holdDuration, target: peakVus },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: false }],
    http_req_duration: [{ threshold: "p(95)<8000", abortOnFail: false }],
  },
};

export default function publicShowcaseBurst() {
  const path = showcasePaths[__ITER % showcasePaths.length];
  const response = http.get(`${base}${path}`, {
    tags: { name: path },
    timeout: "30s",
  });

  check(response, {
    "status is success": (res) => res.status >= 200 && res.status < 400,
    "not server error": (res) => res.status < 500,
  });

  sleep(0.3 + Math.random() * 0.4);
}
