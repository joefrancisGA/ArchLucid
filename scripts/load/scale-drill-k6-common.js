/**
 * Shared k6 helpers for TB-946 single-signal scale micro-drills (staging / local).
 */
import http from "k6/http";

export const base = (__ENV.ARCHLUCID_BASE_URL || "http://127.0.0.1:5128").replace(/\/$/, "");
export const apiKey = __ENV.ARCHLUCID_API_KEY || "";
export const tenant = __ENV.ARCHLUCID_TENANT_ID || "11111111-1111-1111-1111-111111111111";
export const workspace = __ENV.ARCHLUCID_WORKSPACE_ID || "22222222-2222-2222-2222-222222222222";
export const project = __ENV.ARCHLUCID_PROJECT_ID || "33333333-3333-3333-3333-333333333333";
export const runId = __ENV.ARCHLUCID_RUN_ID || "00000000-0000-0000-0000-000000000001";

export function headers(jsonBody) {
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

export function okRead(response) {
  return (
    (response.status >= 200 && response.status < 300) ||
    response.status === 404 ||
    response.status === 401 ||
    response.status === 403 ||
    response.status === 429 ||
    response.status === 503
  );
}

export function okWrite(response) {
  return (
    (response.status >= 200 && response.status < 300) ||
    response.status === 400 ||
    response.status === 409 ||
    response.status === 401 ||
    response.status === 403 ||
    response.status === 429 ||
    response.status === 503
  );
}

export function rampingVusScenario(peakVus, rampDuration, holdDuration, execName) {
  return {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: rampDuration, target: peakVus },
      { duration: holdDuration, target: peakVus },
      { duration: "45s", target: 0 },
    ],
    exec: execName,
    gracefulRampDown: "30s",
  };
}

export function postArchitectureRequest() {
  const body = JSON.stringify({
    requestId: `k6-scale-a-${__VU}-${__ITER}-${Date.now()}`,
    description: "TB-946 drill A: concurrent execute/ask path (Simulator-friendly).",
    systemName: "ScaleDrillA",
    environment: "loadtest",
    cloudProvider: 1,
    constraints: [],
    requiredCapabilities: [],
    assumptions: [],
  });

  return http.post(`${base}/v1/architecture/request`, body, {
    headers: headers(true),
    tags: { name: "architecture_request" },
  });
}

export function retrievalSearch() {
  return http.get(`${base}/v1/retrieval/search?q=scale-drill&topK=8`, {
    headers: headers(),
    tags: { name: "retrieval_search" },
  });
}
