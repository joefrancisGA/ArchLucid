/**
 * k6 operator-path smoke — Core Pilot-style regression probe for CI/local:
 * health/ready, version, create run, run snapshot (GET architecture/run/{id}), authority runs list,
 * then optional finish path (DevelopmentBypass + Simulator): seed-fake-results → commit → artifact descriptors.
 *
 * Budget labels (thresholds + Python duplicate gate): **CI / pilot smoke ceilings**, aligned with
 * docs/library/API_SLOS.md tiers for rough parity — **not** contractual production SLOs and **not**
 * enterprise throughput claims.
 *
 * Local:
 *   mkdir -p tests/load/results
 *   ARCHLUCID_BASE_URL=http://127.0.0.1:5128 k6 run tests/load/k6-api-smoke.js
 * Minimal operator slice only (no internal seed/commit — for keyed environments without ExecuteAuthority):
 *   ARCHLUCID_K6_OPERATOR_MINIMAL=1 k6 run tests/load/k6-api-smoke.js
 * Load scenario (20 VUs, ~3m):
 *   K6_SCENARIO=load k6 run tests/load/k6-api-smoke.js
 */
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.ARCHLUCID_BASE_URL || __ENV.BASE_URL || "http://127.0.0.1:5128";
const PROJECT_SLUG = __ENV.ARCHLUCID_AUTHORITY_PROJECT || "default";
const IS_LOAD = __ENV.K6_SCENARIO === "load";
const MINIMAL =
  __ENV.ARCHLUCID_K6_OPERATOR_MINIMAL === "1" || __ENV.ARCHLUCID_K6_OPERATOR_MINIMAL === "true";

const P95_MS = {
  health_ready: Number(__ENV.ARCHLUCID_K6_P95_HEALTH_READY_MS ?? 1200),
  tier2: Number(__ENV.ARCHLUCID_K6_P95_TIER2_MS ?? 800),
  tier3_create: Number(__ENV.ARCHLUCID_K6_P95_TIER3_MS ?? 8000),
  tier3_seed: Number(__ENV.ARCHLUCID_K6_P95_SEED_FAKE_MS ?? __ENV.ARCHLUCID_K6_P95_TIER3_MS ?? 8000),
  tier3_commit: Number(__ENV.ARCHLUCID_K6_P95_COMMIT_MS ?? __ENV.ARCHLUCID_K6_P95_TIER3_MS ?? 8000),
};
const HTTP_FAIL_RATE_MAX = Number(__ENV.ARCHLUCID_K6_HTTP_FAIL_RATE_MAX ?? 0.02);

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

function buildThresholds() {
  const t = {
    http_req_failed: [`rate<${HTTP_FAIL_RATE_MAX}`],
    "http_req_duration{k6api:health_ready}": [`p(95)<${P95_MS.health_ready}`],
    "http_req_duration{k6api:version}": [`p(95)<${P95_MS.tier2}`],
    "http_req_duration{k6api:create_run}": [`p(95)<${P95_MS.tier3_create}`],
    "http_req_duration{k6api:list_authority_runs}": [`p(95)<${P95_MS.tier2}`],
  };

  if (!MINIMAL) {
    t[`http_req_duration{k6api:run_status}`] = [`p(95)<${P95_MS.tier2}`];
    t[`http_req_duration{k6api:seed_fake}`] = [`p(95)<${P95_MS.tier3_seed}`];
    t[`http_req_duration{k6api:pilot_commit}`] = [`p(95)<${P95_MS.tier3_commit}`];
    t[`http_req_duration{k6api:artifacts_list}`] = [`p(95)<${P95_MS.tier2}`];
  }

  return t;
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
    timeout: "120s",
  });

  check(r, { "create run 2xx": (res) => res.status >= 200 && res.status < 300 });

  let runId = null;

  try {
    const j = JSON.parse(r.body);
    const run = j && (j.run || j.Run);
    const id = run && (run.runId || run.RunId);

    if (id !== null && id !== undefined) {
      runId = String(id);
    }
  } catch {
    runId = null;
  }

  if (!MINIMAL && runId !== null && runId.length > 0) {
    r = http.get(`${BASE}/v1/architecture/run/${encodeURIComponent(runId)}`, {
      headers: h,
      tags: { k6api: "run_status" },
    });
    check(r, { "run status 200": (res) => res.status === 200 });
  }

  const listUrl = `${BASE}/v1/authority/projects/${encodeURIComponent(PROJECT_SLUG)}/runs?take=10`;
  r = http.get(listUrl, { headers: h, tags: { k6api: "list_authority_runs" } });
  check(r, { "authority runs 200": (res) => res.status === 200 });

  if (MINIMAL || runId === null || runId.length === 0) {
    return;
  }

  const jsonHeaders = Object.assign({}, h, { "Content-Type": "application/json" });
  r = http.post(`${BASE}/v1/internal/architecture/runs/${encodeURIComponent(runId)}/seed-fake-results`, "{}", {
    headers: jsonHeaders,
    tags: { k6api: "seed_fake" },
    timeout: "120s",
  });
  check(r, { "seed fake 2xx": (res) => res.status >= 200 && res.status < 300 });

  r = http.post(`${BASE}/v1/architecture/run/${encodeURIComponent(runId)}/commit`, "{}", {
    headers: jsonHeaders,
    tags: { k6api: "pilot_commit" },
    timeout: "120s",
  });
  check(r, { "commit 2xx": (res) => res.status >= 200 && res.status < 300 });

  let manifestId = null;

  try {
    const cj = JSON.parse(r.body);
    const manifest = cj && (cj.manifest || cj.Manifest);
    const mid = manifest && (manifest.manifestId || manifest.ManifestId);

    if (mid !== null && mid !== undefined) {
      manifestId = String(mid);
    }
  } catch {
    manifestId = null;
  }

  if (manifestId === null || manifestId.length === 0) {
    return;
  }

  r = http.get(`${BASE}/v1/artifacts/manifests/${encodeURIComponent(manifestId)}`, {
    headers: h,
    tags: { k6api: "artifacts_list" },
  });
  check(r, { "artifacts list 200": (res) => res.status === 200 });
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
  thresholds: buildThresholds(),
};

export function handleSummary(data) {
  const out = __ENV.K6_SUMMARY_PATH || "tests/load/results/k6-summary.json";

  return {
    [out]: JSON.stringify(data),
  };
}
