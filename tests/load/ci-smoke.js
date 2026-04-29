/**
 * k6 CI smoke — read + write operator API paths (DevelopmentBypass-friendly).
 * Scenarios: health (live+ready), version, create_run, list_runs, audit_search, get_run_detail, client_error_telemetry.
 * get_run_detail: list runs, create a run, GET that id (avoids 404 list probes that inflate http_req_failed).
 *
 * Latency SLO alignment: docs/library/API_SLOS.md (Tier 1 / 2 / 3 external p95: 300 ms / 800 ms / 8 s).
 * k6 `thresholds` below fail the process (exit ≠ 0) when breached — merge-blocking before the Python gate.
 *
 * Environment (optional overrides):
 *   ARCHLUCID_BASE_URL | BASE_URL     — API root (default http://127.0.0.1:5128)
 *   ARCHLUCID_K6_P95_HEALTH_LIVE_MS   — Tier 1 live (default 300)
 *   ARCHLUCID_K6_P95_HEALTH_READY_MS  — ready probes SQL/deps; default 1200 (noisier on Actions)
 *   ARCHLUCID_K6_P95_TIER2_MS         — list/version/audit/detail/telemetry (default 800)
 *   ARCHLUCID_K6_P95_TIER3_MS         — create_run write path (default 8000)
 *   ARCHLUCID_K6_HTTP_FAIL_RATE_MAX   — http_req_failed rate ceiling (default 0.02 for CI noise; stricter in prod monitoring)
 *
 * Run: BASE_URL=http://127.0.0.1:5128 k6 run tests/load/ci-smoke.js --summary-export /tmp/k6-ci-summary.json
 */
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.ARCHLUCID_BASE_URL || __ENV.BASE_URL || "http://127.0.0.1:5128";

// Latency defaults follow docs/library/API_SLOS.md (Tier 1 / 2 / 3). Override per env when CI runners are noisy.
const P95_MS = {
  health_live: Number(__ENV.ARCHLUCID_K6_P95_HEALTH_LIVE_MS ?? 300),
  health_ready: Number(__ENV.ARCHLUCID_K6_P95_HEALTH_READY_MS ?? 1200),
  tier2: Number(__ENV.ARCHLUCID_K6_P95_TIER2_MS ?? 800),
  tier3_create: Number(__ENV.ARCHLUCID_K6_P95_TIER3_MS ?? 8000),
};
const HTTP_FAIL_RATE_MAX = Number(__ENV.ARCHLUCID_K6_HTTP_FAIL_RATE_MAX ?? 0.02);

function req(scenario, method, url, body = null, extraParams = null) {
  const params = {
    headers: {
      "X-Correlation-ID": `k6-ci-${scenario}-${__VU}-${__ITER}`,
      Accept: "application/json",
    },
    tags: { k6ci: scenario },
    ...(extraParams ?? {}),
  };

  if (body !== null) {
    params.headers["Content-Type"] = "application/json";
  }

  if (method === "GET") {
    return http.get(url, params);
  }

  return http.request(method, url, body, params);
}

export function healthFn() {
  let r = req("health_live", "GET", `${BASE}/health/live`);
  check(r, { "health live 200": (res) => res.status === 200 });

  r = req("health_ready", "GET", `${BASE}/health/ready`);
  check(r, { "health ready 200": (res) => res.status === 200 });
}

function createArchitectureRequestBody(requestIdPrefix) {
  return JSON.stringify({
    requestId: `${requestIdPrefix}-${__VU}-${__ITER}-${Date.now()}`,
    description: "k6 CI smoke write-path test",
    systemName: "K6CiSmokeSystem",
    environment: "prod",
    cloudProvider: 1,
    constraints: [],
    requiredCapabilities: ["SQL"],
    assumptions: [],
    priorManifestVersion: null,
  });
}

export function createRunFn() {
  const body = createArchitectureRequestBody("k6-ci");
  const r = req("create_run", "POST", `${BASE}/v1/architecture/request`, body, { timeout: "120s" });
  check(r, { "create run 2xx": (res) => res.status >= 200 && res.status < 300 });
}

export function listRunsFn() {
  const r = req("list_runs", "GET", `${BASE}/v1/architecture/runs`);
  check(r, { "list runs 200": (res) => res.status === 200 });
}

export function auditSearchFn() {
  const r = req("audit_search", "GET", `${BASE}/v1/audit/search?take=20`);
  check(r, { "audit search 200": (res) => res.status === 200 });
}

export function versionFn() {
  const r = req("version", "GET", `${BASE}/version`);
  check(r, { "version 200": (res) => res.status === 200 });
}

export function getRunDetailFn() {
  const list = req("list_for_get_run", "GET", `${BASE}/v1/architecture/runs`);
  check(list, { "list for get run 200": (res) => res.status === 200 });

  // A single GET by id from the list can be 404 (e.g. manifest version set with no manifest row), and k6 counts every
  // 4xx toward http_req_failed. Create a run in this VU, then GET that id — one detail call that should 200, no probe 404s.
  const createBody = createArchitectureRequestBody("k6-ci-gtr");
  const created = req("create_run", "POST", `${BASE}/v1/architecture/request`, createBody, { timeout: "120s" });
  check(created, { "get run path create 2xx": (res) => res.status >= 200 && res.status < 300 });

  let runId;

  try {
    const j = JSON.parse(created.body);
    const run = j && (j.run || j.Run);
    const id = run && (run.runId || run.RunId);

    if (id !== null && id !== undefined) {
      runId = String(id);
    }
  } catch {
    return;
  }

  if (runId === null || runId === undefined || runId.length === 0) {
    return;
  }

  const detail = req("get_run_detail", "GET", `${BASE}/v1/architecture/run/${encodeURIComponent(runId)}`);
  check(detail, { "get run detail 200": (res) => res.status === 200 });
}

export function clientErrorTelemetryFn() {
  const body = JSON.stringify({
    message: "k6 ci smoke diagnostics probe",
    pathname: "/k6-ci-smoke-probe",
    context: { source: "k6-ci-smoke" },
  });
  const r = req("client_error_telemetry", "POST", `${BASE}/v1/diagnostics/client-error`, body);
  check(r, { "client error telemetry 204": (res) => res.status === 204 });
}

export const options = {
  scenarios: {
    health: {
      executor: "constant-vus",
      vus: 5,
      duration: "20s",
      exec: "healthFn",
    },
    create_run: {
      executor: "constant-vus",
      vus: 2,
      duration: "30s",
      exec: "createRunFn",
    },
    list_runs: {
      executor: "constant-vus",
      startTime: "5s",
      vus: 3,
      duration: "20s",
      exec: "listRunsFn",
    },
    audit_search: {
      executor: "constant-vus",
      vus: 2,
      duration: "20s",
      exec: "auditSearchFn",
    },
    version: {
      executor: "constant-vus",
      vus: 2,
      duration: "20s",
      exec: "versionFn",
    },
    get_run_detail: {
      executor: "constant-vus",
      startTime: "8s",
      vus: 2,
      duration: "20s",
      exec: "getRunDetailFn",
    },
    client_error_telemetry: {
      executor: "constant-vus",
      startTime: "10s",
      vus: 1,
      duration: "18s",
      exec: "clientErrorTelemetryFn",
    },
  },
  thresholds: {
    http_req_failed: [`rate<${HTTP_FAIL_RATE_MAX}`],
    // Split tags: live stays lightweight; ready runs dependency probes (SQL, etc.) and is noisy on Actions — do not merge into one threshold.
    "http_req_duration{k6ci:health_live}": [`p(95)<${P95_MS.health_live}`],
    "http_req_duration{k6ci:health_ready}": [`p(95)<${P95_MS.health_ready}`],
    "http_req_duration{k6ci:create_run}": [`p(95)<${P95_MS.tier3_create}`],
    "http_req_duration{k6ci:list_runs}": [`p(95)<${P95_MS.tier2}`],
    "http_req_duration{k6ci:audit_search}": [`p(95)<${P95_MS.tier2}`],
    "http_req_duration{k6ci:version}": [`p(95)<${P95_MS.tier2}`],
    "http_req_duration{k6ci:list_for_get_run}": [`p(95)<${P95_MS.tier2}`],
    "http_req_duration{k6ci:get_run_detail}": [`p(95)<${P95_MS.tier2}`],
    "http_req_duration{k6ci:client_error_telemetry}": [`p(95)<${P95_MS.tier2}`],
  },
};
