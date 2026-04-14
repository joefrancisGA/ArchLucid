/**
 * k6 soak — longer, low-rate read-only mix (scheduled / manual; not a merge gate).
 * Run: BASE_URL=https://api.example k6 run tests/load/soak.js --summary-export k6-soak-summary.json
 */
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:5128";

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
    http_req_failed: ["rate<0.05"],
    "http_req_duration{k6soak:health}": ["p(95)<2000"],
    "http_req_duration{k6soak:version}": ["p(95)<2000"],
    "http_req_duration{k6soak:runs_list}": ["p(95)<8000"],
    "http_req_duration{k6soak:audit_search}": ["p(95)<8000"],
  },
};
