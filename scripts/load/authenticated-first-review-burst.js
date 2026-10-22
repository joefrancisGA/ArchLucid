/**
 * Authenticated read burst — simulates concurrent tenants hitting list/detail reads (no LLM write path).
 *
 * Prerequisites: API with Simulator mode, seeded scope headers, optional X-Api-Key.
 *
 * Usage:
 *   k6 run scripts/load/authenticated-first-review-burst.js
 *   k6 run -e ARCHLUCID_BASE_URL=http://127.0.0.1:5128 -e K6_AUTH_PEAK_VUS=20 scripts/load/authenticated-first-review-burst.js
 *
 * Env:
 *   ARCHLUCID_BASE_URL / ARCHLUCID_API_KEY / scope GUIDs — same as scripts/load/k6-scenarios.js
 *   K6_AUTH_PEAK_VUS        peak VUs (default 15)
 *   K6_AUTH_RAMP / K6_AUTH_HOLD
 *   ARCHLUCID_LOAD_TEST_WRITES=true  → adds low-rate POST /v1/architecture/request (opt-in)
 */

import http from "k6/http";
import { check, sleep } from "k6";

const base = (__ENV.ARCHLUCID_BASE_URL || "http://127.0.0.1:5128").replace(
  /\/$/,
  "",
);
const apiKey = __ENV.ARCHLUCID_API_KEY || "";
const tenant = __ENV.ARCHLUCID_TENANT_ID || "11111111-1111-1111-1111-111111111111";
const workspace = __ENV.ARCHLUCID_WORKSPACE_ID || "22222222-2222-2222-2222-222222222222";
const project = __ENV.ARCHLUCID_PROJECT_ID || "33333333-3333-3333-3333-333333333333";
const runId = __ENV.ARCHLUCID_RUN_ID || "00000000-0000-0000-0000-000000000001";

const peakVus = Number(__ENV.K6_AUTH_PEAK_VUS || 15);
const rampDuration = __ENV.K6_AUTH_RAMP || "1m";
const holdDuration = __ENV.K6_AUTH_HOLD || "3m";
const loadTestWrites = __ENV.ARCHLUCID_LOAD_TEST_WRITES === "true";

function headers(jsonBody) {
  const h = {
    Accept: "application/json",
    "x-tenant-id": tenant,
    "x-workspace-id": workspace,
    "x-project-id": project,
  };

  if (apiKey) {
    h["X-Api-Key"] = apiKey;
  }

  if (jsonBody) {
    h["Content-Type"] = "application/json";
  }

  return h;
}

function okRead(response) {
  return (
    (response.status >= 200 && response.status < 300) ||
    response.status === 404 ||
    response.status === 401 ||
    response.status === 429
  );
}

const writeScenario = loadTestWrites
  ? {
      auth_write_burst: {
        executor: "constant-vus",
        vus: Number(__ENV.K6_AUTH_WRITE_VUS || 2),
        duration: holdDuration,
        exec: "postArchitectureRequest",
        startTime: rampDuration,
      },
    }
  : {};

export const options = {
  scenarios: {
    auth_read_burst: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: rampDuration, target: peakVus },
        { duration: holdDuration, target: peakVus },
        { duration: "45s", target: 0 },
      ],
      exec: "authenticatedReadBurst",
      gracefulRampDown: "30s",
    },
    ...writeScenario,
  },
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.02", abortOnFail: false }],
    http_req_duration: [{ threshold: "p(95)<10000", abortOnFail: false }],
  },
};

export function authenticatedReadBurst() {
  const auditSearch = http.get(
    `${base}/v1/audit/search?query=&page=1&pageSize=10`,
    { headers: headers(), tags: { name: "audit_search" } },
  );
  check(auditSearch, { audit_search_ok: okRead });

  const runDetail = http.get(`${base}/v1/authority/runs/${runId}`, {
    headers: headers(),
    tags: { name: "run_detail" },
  });
  check(runDetail, { run_detail_ok: okRead });

  sleep(0.5 + Math.random() * 0.5);
}

export function postArchitectureRequest() {
  const body = JSON.stringify({
    requestId: `k6-burst-${__VU}-${__ITER}-${Date.now()}`,
    description: "Launch load drill architecture request",
    systemName: "LaunchLoadDrill",
    environment: "prod",
    cloudProvider: 1,
    constraints: [],
    requiredCapabilities: ["SQL"],
    assumptions: [],
    priorManifestVersion: null,
  });

  const response = http.post(`${base}/v1/architecture/request`, body, {
    headers: headers(true),
    tags: { name: "architecture_request" },
  });

  check(response, {
    architecture_request_ok: (res) => res.status === 200 || res.status === 201 || res.status === 409 || res.status === 429,
  });

  sleep(1);
}
