/**
 * k6 soak — longer, low-rate read-only mix (scheduled / manual; not a merge gate).
 * Default base URL is local only — production traffic must never be coded into repo YAML.
 * Run: BASE_URL=https://api.staging.example k6 run tests/load/soak.js --summary-export k6-soak-summary.json
 *
 * Threshold env overrides (optional; align with docs/library/API_SLOS.md Tier 1/2 where practical):
 *   ARCHLUCID_K6_SOAK_P95_TIER1_MS   — health + version (default 2000)
 *   ARCHLUCID_K6_SOAK_P95_TIER2_MS   — list + audit (default 8000)
 *   ARCHLUCID_K6_SOAK_HTTP_FAIL_RATE_MAX — failed request rate ceiling (default 0.05)
 */
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.ARCHLUCID_BASE_URL || __ENV.BASE_URL || "http://127.0.0.1:5128";

const P95_TIER1 = Number(__ENV.ARCHLUCID_K6_SOAK_P95_TIER1_MS ?? 2000);
const P95_TIER2 = Number(__ENV.ARCHLUCID_K6_SOAK_P95_TIER2_MS ?? 8000);
const HTTP_FAIL_RATE_MAX = Number(__ENV.ARCHLUCID_K6_SOAK_HTTP_FAIL_RATE_MAX ?? 0.05);

function req(scenario, method, url) {
  const params = {
    headers: {
      "X-Correlation-ID": `k6-soak-${scenario}-${__VU}-${__ITER}`,
    },
    tags: { k6soak: scenario },
  };

  if (method === "GET") {
    return http.get(url, params);
  }

  return http.request(method, url, null, params);
}

export function soakMix() {
  let r = req("health", "GET", `${BASE}/health/live`);
  check(r, { "health live 200": (res) => res.status === 200 });

  r = req("version", "GET", `${BASE}/version`);
  check(r, { "version 200": (res) => res.status === 200 });

  r = req("runs_list", "GET", `${BASE}/v1/architecture/runs`);
  check(r, { "runs list 200": (res) => res.status === 200 });

  r = req("audit_search", "GET", `${BASE}/v1/audit/search?take=25`);
  check(r, { "audit search 200": (res) => res.status === 200 });
}

export const options = {
  scenarios: {
    soak: {
      executor: "constant-vus",
      vus: Number(__ENV.SOAK_VUS || 3),
      duration: __ENV.SOAK_DURATION || "4m",
      gracefulStop: "30s",
      exec: "soakMix",
    },
  },
  thresholds: {
    http_req_failed: [`rate<${HTTP_FAIL_RATE_MAX}`],
    "http_req_duration{k6soak:health}": [`p(95)<${P95_TIER1}`],
    "http_req_duration{k6soak:version}": [`p(95)<${P95_TIER1}`],
    "http_req_duration{k6soak:runs_list}": [`p(95)<${P95_TIER2}`],
    "http_req_duration{k6soak:audit_search}": [`p(95)<${P95_TIER2}`],
  },
};
