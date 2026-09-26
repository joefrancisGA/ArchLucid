/** Repeatable read workload across pre-provisioned synthetic SecureNow scopes. */
import http from "k6/http";
import { check, sleep } from "k6";

const base = (__ENV.ARCHLUCID_BASE_URL || "http://127.0.0.1:5128").replace(/\/$/, "");
const scopes = JSON.parse(__ENV.SECURENOW_TEST_SCOPES_JSON || "[]");
if (scopes.length < 2 || scopes.some((s) => !s.tenantId || !s.workspaceId || !s.projectId || !s.snapshotId || !s.apiKey)) {
  throw new Error("SECURENOW_TEST_SCOPES_JSON requires at least two synthetic scopes with IDs, snapshotId, and apiKey");
}
if (new Set(scopes.map((s) => s.tenantId)).size !== scopes.length) {
  throw new Error("Each synthetic scope must use a distinct tenantId");
}

export const options = {
  scenarios: { reads: { executor: "constant-vus", vus: Number(__ENV.VUS || 10), duration: __ENV.DURATION || "2m" } },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
    checks: ["rate>0.99"],
  },
};

function request(scope, path, name) {
  const response = http.get(`${base}${path}`, {
    headers: { "X-Api-Key": scope.apiKey, "x-tenant-id": scope.tenantId,
      "x-workspace-id": scope.workspaceId, "x-project-id": scope.projectId },
    tags: { name },
  });
  check(response, { [`${name}_200`]: (r) => r.status === 200 });
}

export default function () {
  const scope = scopes[(__VU - 1) % scopes.length];
  request(scope, `/v1/infra-evidence/snapshots?page=1&pageSize=20`, "snapshot_list");
  request(scope, `/v1/operational-security/paths/ranked?snapshotId=${encodeURIComponent(scope.snapshotId)}&page=1&pageSize=20`, "ranked_paths");
  sleep(0.2);
}

export function handleSummary(data) {
  return { "securenow-multitenant-k6.json": JSON.stringify(data, null, 2) };
}
