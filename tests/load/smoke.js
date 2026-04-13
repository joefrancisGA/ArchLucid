/**
 * k6 smoke load test — read-only operator API paths (DevelopmentBypass-friendly).
 * Run: BASE_URL=http://127.0.0.1:5128 k6 run tests/load/smoke.js --out json=k6-results.json
 */
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:5128";
const PROJECT = "00000000-0000-0000-0000-000000000001";

function req(scenario, method, url, body = null) {
  const params = {
    headers: {
      "X-Correlation-ID": `k6-smoke-${scenario}-${__VU}-${__ITER}`,
    },
    tags: { k6smoke: scenario },
  };

  if (method === "GET") {
    return http.get(url, params);
  }

  return http.request(method, url, body, params);
}

export function healthFn() {
  let r = req("health", "GET", `${BASE}/health/live`);
  check(r, { "health live 200": (res) => res.status === 200 });
  r = req("health", "GET", `${BASE}/health/ready`);
  check(r, { "health ready 200": (res) => res.status === 200 });
}

export function runsListFn() {
  const url = `${BASE}/v1/authority/projects/${PROJECT}/runs?page=1&pageSize=20`;
  const r = req("runs_list", "GET", url);
  check(r, { "runs list 200": (res) => res.status === 200 });
}

export function versionFn() {
  const r = req("version", "GET", `${BASE}/version`);
  check(r, { "version 200": (res) => res.status === 200 });
}

export function auditSearchFn() {
  const r = req("audit_search", "GET", `${BASE}/v1/audit/search?maxResults=50`);
  check(r, { "audit search 200": (res) => res.status === 200 });
}

export const options = {
  scenarios: {
    health: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [{ duration: "30s", target: 10 }],
      gracefulRampDown: "5s",
      exec: "healthFn",
    },
    runs_list: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [{ duration: "30s", target: 5 }],
      gracefulRampDown: "5s",
      exec: "runsListFn",
    },
    version: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [{ duration: "30s", target: 5 }],
      gracefulRampDown: "5s",
      exec: "versionFn",
    },
    audit_search: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [{ duration: "30s", target: 3 }],
      gracefulRampDown: "5s",
      exec: "auditSearchFn",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{k6smoke:health}": ["p(95)<500"],
    "http_req_duration{k6smoke:version}": ["p(95)<500"],
    "http_req_duration{k6smoke:runs_list}": ["p(95)<2000"],
    "http_req_duration{k6smoke:audit_search}": ["p(95)<2000"],
  },
};
