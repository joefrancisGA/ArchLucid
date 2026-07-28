/**
 * k6 — large evidence package (simulator-friendly architecture request payload size).
 *
 * Paced create-run profile: measures POST /v1/architecture/request latency under a large
 * ArchitectureRequest JSON body (validator max 50 constraints/capabilities + near-max description).
 * Default arrival rate stays under Development's fixed
 * rate-limit window (2000/min) without raising PermitLimit.
 *
 * PowerShell (DevelopmentBypass + Simulator on :5128):
 *   $env:ARCHLUCID_BASE_URL = "http://127.0.0.1:5128"
 *   k6 run tests/load/large-evidence-package.js
 *
 * Optional — intentional high-rate stress (not the default profile intent):
 *   $env:RateLimiting__FixedWindow__PermitLimit = "200000"
 *   dotnet run --project ArchLucid.Api
 *
 * Scheduled CI: .github/workflows/k6-production-like-scheduled.yml (API via start_api_for_k6.sh).
 */
import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";
import { buildProductionLikeSummaryEnvelope, slowestK6Tag } from "./production-like-summary.js";

const BASE = __ENV.ARCHLUCID_BASE_URL || __ENV.BASE_URL || "http://127.0.0.1:5128";
const VUS = Number(__ENV.K6_LARGE_EVIDENCE_VUS || 3);
const MAX_VUS = Number(__ENV.K6_LARGE_EVIDENCE_MAX_VUS || Math.max(VUS * 2, 6));
const RATE = Number(__ENV.K6_LARGE_EVIDENCE_RATE || 4);
const DURATION = __ENV.K6_LARGE_EVIDENCE_DURATION || "45s";
const SUMMARY_PATH =
  __ENV.K6_SUMMARY_PATH || "tests/load/results/large-evidence-package.json";

// ArchitectureRequestValidator caps Constraints and RequiredCapabilities at 50 items each.
const CONSTRAINT_COUNT = Number(__ENV.K6_LARGE_EVIDENCE_CONSTRAINTS || 50);
const CAPABILITY_COUNT = Number(__ENV.K6_LARGE_EVIDENCE_CAPABILITIES || 50);

// LlmSemanticAdmissionGate requires an architecture-domain term in Description (see post-commit-operator-path.js).
const DESCRIPTION_PREFIX = "k6 large evidence architecture package — ";
const MAX_DESCRIPTION_LENGTH = 10000;
const DESCRIPTION_REPEAT = Math.floor(MAX_DESCRIPTION_LENGTH / DESCRIPTION_PREFIX.length);

const status2xx = new Counter("k6le_status_2xx");
const status429 = new Counter("k6le_status_429");
const statusOther = new Counter("k6le_status_other");

export const options = {
  scenarios: {
    large_evidence: {
      executor: "constant-arrival-rate",
      rate: RATE,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: VUS,
      maxVUs: MAX_VUS,
      exec: "largeEvidencePackage",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    "http_req_duration{k6le:create_run}": ["p(95)<12000"],
  },
};

function headers() {
  const h = {
    "X-Correlation-ID": `k6-le-${__VU}-${__ITER}-${Date.now()}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const key = __ENV.ARCHLUCID_API_KEY;

  if (key) {
    h["X-Api-Key"] = key;
  }

  return h;
}

function buildLargeRequestBody(requestId) {
  const constraints = [];

  for (let i = 0; i < CONSTRAINT_COUNT; i += 1) {
    constraints.push(`LargeEvidenceConstraint-${i}-${"x".repeat(48)}`);
  }

  const capabilities = [];

  for (let j = 0; j < CAPABILITY_COUNT; j += 1) {
    capabilities.push(`CAP-${j}`);
  }

  const body = {
    requestId: requestId || `k6-le-${__VU}-${__ITER}-${Date.now()}`,
    description: DESCRIPTION_PREFIX.repeat(DESCRIPTION_REPEAT),
    systemName: "K6LargeEvidencePackage",
    environment: "prod",
    cloudProvider: 1,
    constraints,
    requiredCapabilities: capabilities,
    assumptions: ["Large bounded payload for production-like read/write mix"],
    priorManifestVersion: null,
  };

  return JSON.stringify(body);
}

// Init-context size probe (handleSummary cannot read VU-scoped mutations).
const PAYLOAD_BYTES = buildLargeRequestBody("k6-le-template-bytes").length;

function recordStatusClass(response) {
  if (response.status >= 200 && response.status < 300) {
    status2xx.add(1);
    return;
  }

  if (response.status === 429) {
    status429.add(1);
    return;
  }

  statusOther.add(1);
}

function counterCount(data, metricName) {
  const metric = data.metrics && data.metrics[metricName];

  if (!metric || !metric.values) {
    return 0;
  }

  return metric.values.count || 0;
}

export function largeEvidencePackage() {
  const body = buildLargeRequestBody();

  const r = http.post(`${BASE}/v1/architecture/request`, body, {
    headers: headers(),
    tags: { k6le: "create_run" },
    timeout: "120s",
  });

  recordStatusClass(r);
  check(r, { "create run 2xx": (res) => res.status >= 200 && res.status < 300 });
}

export function handleSummary(data) {
  const slowest = slowestK6Tag(data, "http_req_duration{k6le:");
  const envelope = buildProductionLikeSummaryEnvelope(data, {
    profile: "large-evidence-package",
    mode: "simulator",
    baseUrl: BASE,
    evidencePayloadBytes: PAYLOAD_BYTES,
    slowestRouteTag: slowest,
  });

  const errorRate = envelope.errorRate;
  const count2xx = counterCount(data, "k6le_status_2xx");
  const count429 = counterCount(data, "k6le_status_429");
  const countOther = counterCount(data, "k6le_status_other");
  const rateLimitHint =
    count429 > 0
      ? " — 429 responses dominate; raise RateLimiting__FixedWindow__PermitLimit only for intentional stress"
      : "";

  return {
    [SUMMARY_PATH]: JSON.stringify(envelope, null, 2),
    stdout:
      `\nlarge-evidence-package slowest tagged route: ${slowest}` +
      ` payloadBytes=${PAYLOAD_BYTES}` +
      ` errorRate=${typeof errorRate === "number" ? errorRate.toFixed(4) : "n/a"}` +
      ` status2xx=${count2xx} status429=${count429} statusOther=${countOther}${rateLimitHint}\n`,
  };
}
