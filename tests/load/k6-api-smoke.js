/**
 * k6 operator-path smoke: health/ready, version, create run, authority runs list.
 * DevelopmentBypass-friendly; optional ApiKey via ARCHLUCID_API_KEY.
 *
 * Local:
 *   mkdir -p tests/load/results
 *   ARCHLUCID_BASE_URL=http://127.0.0.1:5128 k6 run tests/load/k6-api-smoke.js
 * Load scenario (20 VUs, ~3m):
 *   K6_SCENARIO=load k6 run tests/load/k6-api-smoke.js
 */
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.ARCHLUCID_BASE_URL || __ENV.BASE_URL || "http://127.0.0.1:5128";
const PROJECT_SLUG = __ENV.ARCHLUCID_AUTHORITY_PROJECT || "default";
const IS_LOAD = __ENV.K6_SCENARIO === "load";

function headers() {
  const h = {
    "X-Correlation-ID": `k6-api-${__VU}-${__ITER}-${Date.now()}`,
    Accept: "application/json",
  };

  const key = __ENV.ARCHLUCID_API_KEY;

  if (key) {
    h["X-Api-Key"] = key;
  }

  return h;
}

export function operatorPath() {
  const h = headers();

  let r = http.get(`${BASE}/health/ready`, { headers: h, tags: { k6api: "health_ready" } });

  check(r, {
    "health ready 200": (res) => res.status === 200,
    "health ready status Healthy": (res) => {
      try {
        const j = JSON.parse(res.body);

        return j.status === "Healthy";
      } catch {
        return false;
      }
    },
  });

  r = http.get(`${BASE}/version`, { headers: h, tags: { k6api: "version" } });
  check(r, { "version 200": (res) => res.status === 200 });

  const body = JSON.stringify({
    requestId: `k6-api-${__VU}-${__ITER}-${Date.now()}`,
    description: "k6 api smoke operator path — architecture request body for load test",
    systemName: "K6ApiSmokeSystem",
    environment: "prod",
    cloudProvider: 1,
    constraints: [],
    requiredCapabilities: ["SQL"],
    assumptions: [],
    priorManifestVersion: null,
  });

  r = http.post(`${BASE}/v1/architecture/request`, body, {
    headers: Object.assign({}, h, { "Content-Type": "application/json" }),
    tags: { k6api: "create_run" },
  });

  check(r, { "create run 2xx": (res) => res.status >= 200 && res.status < 300 });

  const listUrl = `${BASE}/v1/authority/projects/${encodeURIComponent(PROJECT_SLUG)}/runs?take=10`;
  r = http.get(listUrl, { headers: h, tags: { k6api: "list_authority_runs" } });
  check(r, { "authority runs 200": (res) => res.status === 200 });
}

export const options = {
  scenarios: {
    default: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: IS_LOAD
        ? [
            { duration: "30s", target: 20 },
            { duration: "2m", target: 20 },
            { duration: "30s", target: 0 },
          ]
        : [
            { duration: "10s", target: 5 },
            { duration: "40s", target: 5 },
            { duration: "10s", target: 0 },
          ],
      gracefulRampDown: "10s",
      exec: "operatorPath",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
  },
};

export function handleSummary(data) {
  const out = __ENV.K6_SUMMARY_PATH || "tests/load/results/k6-summary.json";

  return {
    [out]: JSON.stringify(data),
  };
}
