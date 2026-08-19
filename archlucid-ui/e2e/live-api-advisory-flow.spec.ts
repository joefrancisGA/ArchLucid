/**
 * Requires a running ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 * Not part of the mock `playwright.config.ts` suite — run:
 *   npx playwright test
 * Set `LIVE_API_URL` if the API is not on http://127.0.0.1:5128.
 */
import { expect, test } from "@playwright/test";

import {
  commitRun,
  createRun,
  executeRun,
  freshIsolatedTenantScope,
  liveE2eArchitectureDescription,
  postAdvisoryScanRaw,
  searchAudit,
  waitForLiveApiReady,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";

test.describe("live-api-advisory-flow", () => {
  const tenantScope = freshIsolatedTenantScope();

  test.beforeAll(async ({ request }) => {
    await waitForLiveApiReady(request);
  });

  test("schedule advisory scan after committed run and verify audit trail", async ({ request }) => {
    test.setTimeout(180_000);

    const createBody = {
      requestId: `E2E-LIVE-ADVISORY-${Date.now()}`,
      description: liveE2eArchitectureDescription("Live E2E: advisory scan scheduling after commit."),
      systemName: "AdvisoryFlowTest",
      environment: "prod",
      cloudProvider: 1,
      constraints: [] as string[],
      requiredCapabilities: ["SQL"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const { runId } = await createRun(request, createBody, tenantScope);
    test.info().annotations.push({ type: "e2e-run-id", description: runId });

    await executeRun(request, runId, tenantScope);
    await waitForReadyForCommit(request, runId, 90_000, tenantScope);
    await commitRun(request, runId, tenantScope);
    await waitForRunDetailCommitted(request, runId, 60_000, tenantScope);

    const scanRes = await postAdvisoryScanRaw(request, { runId, description: "E2E advisory scan test" }, tenantScope);

    if (scanRes.status() === 404) {
      test.skip(true, "Advisory scan scheduling endpoint not available in this build");
      return;
    }

    expect
      .soft(scanRes.ok() || scanRes.status() === 409, `advisory scan POST expected 2xx or 409, got ${scanRes.status()}`)
      .toBe(true);

    const auditEvents = await searchAudit(request, {
      runId,
      take: "200",
      tenantId: tenantScope.tenantId,
      workspaceId: tenantScope.workspaceId,
      projectId: tenantScope.projectId,
    });
    const types = new Set(auditEvents.map((e) => e.eventType).filter(Boolean) as string[]);

    expect
      .soft(types.has("AdvisoryScanScheduled") || types.has("AdvisoryScanExecuted"), "Expected advisory audit event")
      .toBe(true);
  });
});
