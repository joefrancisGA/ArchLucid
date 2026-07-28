/**
 * Auth-parity spine: API-only create → execute → list journey shared by ApiKey/JWT lanes.
 * Keeps runtime bounded vs full UI core-pilot-path while proving ExecuteAuthority + read parity.
 */
import { test } from "@playwright/test";

import {
  createRun,
  enrichArchitectureRequestBody,
  executeRun,
  liveE2eArchitectureDescription,
  liveApiBase,
  resolveLiveAuthMode,
  waitForArchitectureRunListIncludesRun,
  waitForReadyForCommit,
} from "./helpers/live-api-client";

test.describe("live-api-auth-parity-spine", { tag: ["@founder", "@critical"] }, () => {
  test.skip(resolveLiveAuthMode() === "bypass", "Requires LIVE_API_KEY or LIVE_JWT_TOKEN (ApiKey/JWT CI lanes).");

  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(`Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}).`);
    }
  });

  test("create → execute → list includes run under current auth mode", async ({ request }) => {
    test.setTimeout(120_000);

    const createBody = enrichArchitectureRequestBody({
      requestId: `E2E-PARITY-${Date.now()}`,
      description: liveE2eArchitectureDescription,
      systemName: "AuthParitySpine",
      environment: "prod",
      cloudProvider: 1,
      constraints: [] as string[],
      requiredCapabilities: ["SQL"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    });

    const { runId } = await createRun(request, createBody);

    await executeRun(request, runId);
    await waitForReadyForCommit(request, runId, 90_000);

    await waitForArchitectureRunListIncludesRun(request, runId, 90_000);
  });
});
