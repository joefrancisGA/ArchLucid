/**
 * k6 — large evidence package (simulator-friendly architecture request payload size).
 *
 *   ARCHLUCID_BASE_URL=http://127.0.0.1:5128 k6 run tests/load/large-evidence-package.js
 */
import http from "k6/http";
import { check } from "k6";
import { buildProductionLikeSummaryEnvelope, slowestK6Tag } from "./production-like-summary.js";

const BASE = __ENV.ARCHLUCID_BASE_URL || __ENV.BASE_URL || "http://127.0.0.1:5128";
const VUS = Number(__ENV.K6_LARGE_EVIDENCE_VUS || 3);
const DURATION = __ENV.K6_LARGE_EVIDENCE_DURATION || "45s";
const SUMMARY_PATH =
  __ENV.K6_SUMMARY_PATH || "tests/load/results/large-evidence-package.json";

const CONSTRAINT_COUNT = Number(__ENV.K6_LARGE_EVIDENCE_CONSTRAINTS || 120);
const CAPABILITY_COUNT = Number(__ENV.K6_LARGE_EVIDENCE_CAPABILITIES || 80);

export const options = {
  scenarios: {
    large_evidence: {
      executor: "constant-vus",
      vus: VUS,
      duration: DURATION,
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

function buildLargeRequestBody() {
  const constraints = [];

  for (let i = 0; i < CONSTRAINT_COUNT; i += 1) {
    constraints.push(`LargeEvidenceConstraint-${i}-${"x".repeat(48)}`);
  }

  const capabilities = [];

  for (let j = 0; j < CAPABILITY_COUNT; j += 1) {
    capabilities.push(`CAP-${j}`);
  }

  const body = {
    requestId: `k6-le-${__VU}-${__ITER}-${Date.now()}`,
    description: "k6 large evidence package — ".repeat(40),
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

let lastPayloadBytes = 0;

export function largeEvidencePackage() {
  const body = buildLargeRequestBody();
  lastPayloadBytes = body.length;

  const r = http.post(`${BASE}/v1/architecture/request`, body, {
    headers: headers(),
    tags: { k6le: "create_run" },
    timeout: "120s",
  });

  check(r, { "create run 2xx": (res) => res.status >= 200 && res.status < 300 });
}

export function handleSummary(data) {
  const slowest = slowestK6Tag(data, "http_req_duration{k6le:");
  const envelope = buildProductionLikeSummaryEnvelope(data, {
    profile: "large-evidence-package",
    mode: "simulator",
    baseUrl: BASE,
    evidencePayloadBytes: lastPayloadBytes,
    slowestRouteTag: slowest,
  });

  return {
    [SUMMARY_PATH]: JSON.stringify(envelope, null, 2),
    stdout: `\nlarge-evidence-package slowest tagged route: ${slowest} payloadBytes=${lastPayloadBytes}\n`,
  };
}
