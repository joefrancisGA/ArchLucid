/**
 * k6 — post-commit operator path (buyer-realistic read mix after first commit).
 *
 * Exercises: health/version, seed+commit path, run detail, manifest summary, artifacts,
 * aggregate explanation, provenance graph, executive ROI summary, sponsor packet download.
 *
 * Requires DevelopmentBypass + Simulator + internal seed-fake-results (same as k6-api-smoke finish path).
 *
 *   ARCHLUCID_BASE_URL=http://127.0.0.1:5128 k6 run tests/load/post-commit-operator-path.js
 */
import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.ARCHLUCID_BASE_URL || __ENV.BASE_URL || "http://127.0.0.1:5128";
const PROJECT_SLUG = __ENV.ARCHLUCID_AUTHORITY_PROJECT || "default";
const COMPRESS = __ENV.K6_COMPRESS === "1" || __ENV.K6_COMPRESS === "true";
const DURATION = COMPRESS ? "30s" : __ENV.K6_POST_COMMIT_DURATION || "2m";
const VUS = Number(__ENV.K6_POST_COMMIT_VUS || 5);
const HTTP_FAIL_RATE_MAX = Number(__ENV.ARCHLUCID_K6_HTTP_FAIL_RATE_MAX ?? 0.02);
const P95_TIER2 = Number(__ENV.ARCHLUCID_K6_P95_TIER2_MS ?? 928);
const P95_TIER3 = Number(__ENV.ARCHLUCID_K6_P95_TIER3_MS ?? 6600);
const P95_HEALTH = Number(__ENV.ARCHLUCID_K6_P95_HEALTH_READY_MS ?? 1200);
const SUMMARY_PATH =
  __ENV.K6_SUMMARY_PATH || "tests/load/results/post-commit-operator-path.json";

export const options = {
  scenarios: {
    post_commit: {
      executor: "constant-vus",
      vus: VUS,
      duration: DURATION,
      exec: "postCommitOperatorPath",
    },
  },
  thresholds: {
    http_req_failed: [`rate<${HTTP_FAIL_RATE_MAX}`],
    "http_req_duration{k6pc:health_ready}": [`p(95)<${P95_HEALTH}`],
    "http_req_duration{k6pc:version}": [`p(95)<${P95_TIER2}`],
    "http_req_duration{k6pc:create_run}": [`p(95)<${P95_TIER3}`],
    "http_req_duration{k6pc:seed_fake}": [`p(95)<${P95_TIER3}`],
    "http_req_duration{k6pc:commit}": [`p(95)<${P95_TIER3}`],
    "http_req_duration{k6pc:run_detail}": [`p(95)<${P95_TIER2}`],
    "http_req_duration{k6pc:manifest_summary}": [`p(95)<${P95_TIER2}`],
    "http_req_duration{k6pc:artifacts_list}": [`p(95)<${P95_TIER2}`],
    "http_req_duration{k6pc:aggregate_explain}": [`p(95)<${P95_TIER3}`],
    "http_req_duration{k6pc:provenance}": [`p(95)<${P95_TIER3}`],
    "http_req_duration{k6pc:executive_roi}": [`p(95)<${P95_TIER3}`],
    "http_req_duration{k6pc:sponsor_packet}": [`p(95)<${P95_TIER3}`],
  },
};

function headers() {
  const h = {
    "X-Correlation-ID": `k6-pc-${__VU}-${__ITER}-${Date.now()}`,
    Accept: "application/json",
  };

  const key = __ENV.ARCHLUCID_API_KEY;

  if (key) {
    h["X-Api-Key"] = key;
  }

  return h;
}

function getJson(tag, path, tier2) {
  return http.get(`${BASE}${path}`, {
    headers: headers(),
    tags: { k6pc: tag },
    timeout: tier2 ? "60s" : "120s",
  });
}

export function postCommitOperatorPath() {
  const h = headers();
  const jsonHeaders = Object.assign({}, h, { "Content-Type": "application/json" });

  let r = http.get(`${BASE}/health/ready`, { headers: h, tags: { k6pc: "health_ready" } });
  check(r, { "health ready 200": (res) => res.status === 200 });

  r = http.get(`${BASE}/version`, { headers: h, tags: { k6pc: "version" } });
  check(r, { "version 200": (res) => res.status === 200 });

  const body = JSON.stringify({
    requestId: `k6-pc-${__VU}-${__ITER}-${Date.now()}`,
    description: "k6 post-commit operator path — architecture request for committed-run reads",
    systemName: "K6PostCommitPath",
    environment: "prod",
    cloudProvider: 1,
    constraints: [],
    requiredCapabilities: ["SQL"],
    assumptions: [],
    priorManifestVersion: null,
  });

  r = http.post(`${BASE}/v1/architecture/request`, body, {
    headers: jsonHeaders,
    tags: { k6pc: "create_run" },
    timeout: "120s",
  });

  if (!check(r, { "create run 2xx": (res) => res.status >= 200 && res.status < 300 })) {
    return;
  }

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

  if (runId === null || runId.length === 0) {
    return;
  }

  r = http.post(`${BASE}/v1/internal/architecture/runs/${encodeURIComponent(runId)}/seed-fake-results`, "{}", {
    headers: jsonHeaders,
    tags: { k6pc: "seed_fake" },
    timeout: "120s",
  });

  if (!check(r, { "seed fake 2xx": (res) => res.status >= 200 && res.status < 300 })) {
    return;
  }

  r = http.post(`${BASE}/v1/architecture/run/${encodeURIComponent(runId)}/commit`, "{}", {
    headers: jsonHeaders,
    tags: { k6pc: "commit" },
    timeout: "120s",
  });

  if (!check(r, { "commit 2xx": (res) => res.status >= 200 && res.status < 300 })) {
    return;
  }

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

  r = getJson("run_detail", `/v1/authority/runs/${encodeURIComponent(runId)}`, true);
  check(r, { "run detail 200": (res) => res.status === 200 });

  if (manifestId !== null && manifestId.length > 0) {
    r = getJson("manifest_summary", `/v1/authority/manifests/${encodeURIComponent(manifestId)}/summary`, true);
    check(r, { "manifest summary 200": (res) => res.status === 200 });

    r = getJson("artifacts_list", `/v1/artifacts/manifests/${encodeURIComponent(manifestId)}`, true);
    check(r, { "artifacts list 200": (res) => res.status === 200 });
  }

  r = getJson("aggregate_explain", `/v1/explain/runs/${encodeURIComponent(runId)}/aggregate`, false);
  check(r, {
    "aggregate explain ok": (res) => res.status === 200 || res.status === 422,
  });

  r = getJson("provenance", `/v1/authority/runs/${encodeURIComponent(runId)}/provenance`, false);
  check(r, {
    "provenance ok": (res) => res.status === 200 || res.status === 422,
  });

  r = getJson("executive_roi", "/v1/roi/executive-summary", false);
  check(r, { "executive roi 200": (res) => res.status === 200 });

  r = http.get(`${BASE}/v1/pilots/runs/${encodeURIComponent(runId)}/executive-review-packet`, {
    headers: Object.assign({}, h, { Accept: "text/markdown" }),
    tags: { k6pc: "sponsor_packet" },
    timeout: "120s",
  });
  check(r, {
    "sponsor packet ok": (res) => res.status === 200 || res.status === 404,
  });
}

function slowestTag(data) {
  const metrics = data && data.metrics;

  if (!metrics) {
    return "*none*";
  }

  let bestTag = "";
  let bestP95 = -1;

  for (const key of Object.keys(metrics)) {
    if (!key.startsWith("http_req_duration{k6pc:")) {
      continue;
    }

    const p95 = metrics[key].values && metrics[key].values["p(95)"];

    if (typeof p95 === "number" && p95 > bestP95) {
      bestP95 = p95;
      bestTag = key;
    }
  }

  if (bestTag.length === 0) {
    return "*none*";
  }

  return `${bestTag} p95=${Math.round(bestP95)}ms`;
}

export function handleSummary(data) {
  const envelope = {
    schema: "archlucid.k6-post-commit-operator-path.v1",
    baseUrl: BASE,
    slowestRouteTag: slowestTag(data),
    k6: data,
  };

  return {
    [SUMMARY_PATH]: JSON.stringify(envelope, null, 2),
    stdout: `\npost-commit-operator-path slowest tagged route: ${slowestTag(data)}\n`,
  };
}
