/**
 * Per-tenant burst: 10 fixed tenant scopes × operator path (create → seed-fake-results → commit → list artifacts).
 * Each scenario runs at K6_BURST_RATE iterations/s for K6_BURST_DURATION (default 5m). Requires DevelopmentBypass or ApiKey + scope headers.
 *
 * Local smoke (short):
 *   K6_BURST_DURATION=30s K6_BURST_RATE=1 k6 run tests/load/per-tenant-burst.js --summary-export /tmp/k6-burst.json
 */
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.ARCHLUCID_BASE_URL || __ENV.BASE_URL || "http://127.0.0.1:5128";
const BURST_DURATION = __ENV.K6_BURST_DURATION || "5m";
const BURST_RATE = Number(__ENV.K6_BURST_RATE || 5);
const HTTP_FAIL_RATE_MAX = Number(__ENV.K6_BURST_HTTP_FAIL_RATE_MAX ?? 0.05);
const P95_MS = Number(__ENV.K6_BURST_P95_MS ?? 15000);
const HTTP_TIMEOUT = __ENV.K6_BURST_HTTP_TIMEOUT || "180s";

const TENANT_GUIDS = [
  "10000000-0000-4000-8000-000000000001",
  "10000000-0000-4000-8000-000000000002",
  "10000000-0000-4000-8000-000000000003",
  "10000000-0000-4000-8000-000000000004",
  "10000000-0000-4000-8000-000000000005",
  "10000000-0000-4000-8000-000000000006",
  "10000000-0000-4000-8000-000000000007",
  "10000000-0000-4000-8000-000000000008",
  "10000000-0000-4000-8000-000000000009",
  "10000000-0000-4000-8000-00000000000a",
];

const TENANT_COUNT = Math.min(
  TENANT_GUIDS.length,
  Math.max(1, Number(__ENV.K6_BURST_TENANT_COUNT || TENANT_GUIDS.length)),
);

function scopeIdsForTenant(tenantGuid) {
  const parts = tenantGuid.split("-");

  return {
    tenant: tenantGuid,
    workspace: `20000000-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}`,
    project: `30000000-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}`,
  };
}

function scopeHeaders(tenantIndex) {
  const scope = scopeIdsForTenant(TENANT_GUIDS[tenantIndex]);

  const h = {
    Accept: "application/json",
    "X-Correlation-ID": `k6-burst-t${tenantIndex}-${__VU}-${__ITER}-${Date.now()}`,
    "x-tenant-id": scope.tenant,
    "x-workspace-id": scope.workspace,
    "x-project-id": scope.project,
  };

  const key = __ENV.ARCHLUCID_API_KEY;

  if (key) {
    h["X-Api-Key"] = key;
  }

  return h;
}

function post(tenantIndex, path, body) {
  const h = scopeHeaders(tenantIndex);

  const payload = body === null ? "{}" : body;

  const params = {
    headers: Object.assign({}, h, { "Content-Type": "application/json" }),
    tags: { k6burst: "operator" },
    timeout: HTTP_TIMEOUT,
  };

  return http.post(`${BASE}${path}`, payload, params);
}

function get(tenantIndex, path) {
  const h = scopeHeaders(tenantIndex);

  return http.get(`${BASE}${path}`, { headers: h, tags: { k6burst: "operator" }, timeout: HTTP_TIMEOUT });
}

function runBurstForTenant(tenantIndex) {
  const body = JSON.stringify({
    requestId: `k6-burst-t${tenantIndex}-${__VU}-${__ITER}-${Date.now()}`,
    description: "k6 per-tenant burst — architecture request",
    systemName: "K6PerTenantBurst",
    environment: "prod",
    cloudProvider: 1,
    constraints: [],
    requiredCapabilities: ["SQL"],
    assumptions: [],
    priorManifestVersion: null,
  });

  let r = post(tenantIndex, "/v1/architecture/request", body);
  check(r, { "create run 2xx": (res) => res.status >= 200 && res.status < 300 });

  let runId = null;

  try {
    const j = JSON.parse(r.body);

    runId = j.run?.runId || j.Run?.RunId;
  } catch {
    /* parse errors surface in later checks */
  }

  if (!runId) {
    return;
  }

  r = post(tenantIndex, `/v1/internal/architecture/runs/${encodeURIComponent(runId)}/seed-fake-results`, null);
  check(r, { "seed fake 2xx": (res) => res.status >= 200 && res.status < 300 });

  r = post(tenantIndex, `/v1/architecture/run/${encodeURIComponent(runId)}/commit`, null);
  check(r, { "commit 2xx": (res) => res.status >= 200 && res.status < 300 });

  let manifestId = null;

  try {
    const j = JSON.parse(r.body);

    manifestId = j.manifest?.manifestId || j.Manifest?.ManifestId;
  } catch {
    /* ignore */
  }

  if (!manifestId) {
    return;
  }

  r = get(tenantIndex, `/v1/artifacts/manifests/${manifestId}`);
  check(r, { "list artifacts 2xx": (res) => res.status >= 200 && res.status < 300 });
}

export const runBurstT0 = () => runBurstForTenant(0);
export const runBurstT1 = () => runBurstForTenant(1);
export const runBurstT2 = () => runBurstForTenant(2);
export const runBurstT3 = () => runBurstForTenant(3);
export const runBurstT4 = () => runBurstForTenant(4);
export const runBurstT5 = () => runBurstForTenant(5);
export const runBurstT6 = () => runBurstForTenant(6);
export const runBurstT7 = () => runBurstForTenant(7);
export const runBurstT8 = () => runBurstForTenant(8);
export const runBurstT9 = () => runBurstForTenant(9);

function buildScenarios() {
  const scenarios = {};

  for (let i = 0; i < TENANT_COUNT; i++) {
    scenarios[`tenant_${i}`] = {
      executor: "constant-arrival-rate",
      rate: BURST_RATE,
      timeUnit: "1s",
      duration: BURST_DURATION,
      preAllocatedVUs: Math.max(5, BURST_RATE * 3),
      maxVUs: Math.max(30, BURST_RATE * 20),
      exec: `runBurstT${i}`,
    };
  }

  return scenarios;
}

export const options = {
  scenarios: buildScenarios(),
  thresholds: {
    http_req_failed: [`rate<${HTTP_FAIL_RATE_MAX}`],
    http_req_duration: [`p(95)<${P95_MS}`],
  },
};

export function handleSummary(data) {
  const out = __ENV.K6_SUMMARY_PATH || "tests/load/results/k6-per-tenant-burst-summary.json";

  return {
    [out]: JSON.stringify(data),
  };
}
