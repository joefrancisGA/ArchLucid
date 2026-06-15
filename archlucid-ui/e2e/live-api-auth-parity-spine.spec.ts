/**
 * Auth-parity spine: API-only create → execute → list journey shared by ApiKey/JWT lanes.
 * Keeps runtime bounded vs full UI core-pilot-path while proving ExecuteAuthority + read parity.
 */
import { expect, test } from "@playwright/test";

import {
  createRun,
  executeRun,
  listArchitectureRuns,
  liveApiBase,
  normalizeRunIdForCompare,
  resolveLiveAuthMode,
  waitForReadyForCommit,
} from "./helpers/live-api-client";

test.describe("live-api-auth-parity-spine", () => {
  test.skip(resolveLiveAuthMode() === "bypass", "Requires LIVE_API_KEY or LIVE_JWT_TOKEN (ApiKey/JWT CI lanes).");

  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(`Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}).`);
    }
  });

  test("create → execute → list includes run under current auth mode", async ({ request }) => {
    test.setTimeout(120_000);

    const createBody = {
      requestId: `E2E-PARITY-${Date.now()}`,
      description: "Auth-parity spine: create execute list under production-like auth.".padEnd(80, " "),
      systemName: "AuthParitySpine",
      environment: "prod",
      cloudProvider: 1,
      constraints: [] as string[],
      requiredCapabilities: ["SQL"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const { runId } = await createRun(request, createBody);

    await executeRun(request, runId);
    await waitForReadyForCommit(request, runId, 90_000);

    const listed = await listArchitectureRuns(request);
    const normalized = normalizeRunIdForCompare(runId);
    const found = listed.some((row) => normalizeRunIdForCompare(String(row.runId ?? "")) === normalized);

    expect(found, `run ${runId} should appear in GET /v1/architecture/runs`).toBe(true);
  });
});
