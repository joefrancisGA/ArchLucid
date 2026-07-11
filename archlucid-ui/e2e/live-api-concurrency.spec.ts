/**
 * Live API + SQL: parallel mutating calls should not 500; final authority state stays consistent.
 */
import { expect, test } from "@playwright/test";

import {
  commitRun,
  commitRunRaw,
  createApprovalRequest,
  createRun,
  executeRun,
  freshIsolatedTenantScope,
  liveE2eArchitectureDescription,
  postGovernanceApproveRaw,
  searchAudit,
  waitForAuthorityRunSummaryReady,
  waitForLiveApiReady,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";

test.describe("live-api-concurrency", () => {
  // One tenant per test — shared scope let parallel commit + governance races collide on audit/run state.
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ request }) => {
    await waitForLiveApiReady(request);
  });

  test("parallel first commit: both responses succeed without 5xx; run ends Committed", async ({ request }) => {
    test.setTimeout(180_000);

    const tenantScope = freshIsolatedTenantScope();

    const createBody = {
      requestId: `E2E-CONC-COMMIT-${Date.now()}`,
      description: liveE2eArchitectureDescription("Live E2E: parallel commit race."),
      systemName: "ConcurrencyCommitTest",
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

    const [first, second] = await Promise.all([
      commitRunRaw(request, runId, tenantScope),
      commitRunRaw(request, runId, tenantScope),
    ]);

    expect(first.status(), `commit A status ${first.status()}`).toBeLessThan(500);
    expect(second.status(), `commit B status ${second.status()}`).toBeLessThan(500);

    const okish = (code: number) => code === 200 || code === 201 || code === 204 || code === 409;

    expect(okish(first.status()), `commit A unexpected ${first.status()}`).toBe(true);
    expect(okish(second.status()), `commit B unexpected ${second.status()}`).toBe(true);

    const hasSuccessfulCommit = [first.status(), second.status()].some((s) => s >= 200 && s < 300);

    if (!hasSuccessfulCommit) {
      // Both callers can observe transient 409 while the winning commit still converges.
      await waitForRunDetailCommitted(request, runId, 90_000, tenantScope);
    } else {
      expect(hasSuccessfulCommit, "at least one successful commit").toBe(true);
      await waitForRunDetailCommitted(request, runId, 60_000, tenantScope);
    }
  });

  test("parallel governance approve: exactly one 2xx; no 5xx; audit has single GovernanceApprovalApproved", async ({
    request,
  }) => {
    test.setTimeout(240_000);

    const tenantScope = freshIsolatedTenantScope();

    const createBody = {
      requestId: `E2E-CONC-GOV-${Date.now()}`,
      description: liveE2eArchitectureDescription("Live E2E: parallel governance approve."),
      systemName: "ConcurrencyGovTest",
      environment: "prod",
      cloudProvider: 1,
      constraints: [] as string[],
      requiredCapabilities: ["SQL"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const { runId } = await createRun(request, createBody, tenantScope);
    await executeRun(request, runId, tenantScope);
    await waitForReadyForCommit(request, runId, 90_000, tenantScope);

    const commitJson = await commitRun(request, runId, tenantScope);
    const manifestVersion = commitJson.manifest?.metadata?.manifestVersion;

    if (!manifestVersion) {
      throw new Error("Commit response missing manifest.metadata.manifestVersion");
    }

    await waitForRunDetailCommitted(request, runId, 60_000, tenantScope);
    await waitForAuthorityRunSummaryReady(request, runId, 60_000, tenantScope);

    const submitted = await createApprovalRequest(
      request,
      {
        runId,
        manifestVersion,
        sourceEnvironment: "dev",
        targetEnvironment: "test",
        requestComment: "E2E concurrent approve",
      },
      tenantScope,
    );

    const approvalRequestId = submitted.approvalRequestId;

    if (!approvalRequestId) {
      throw new Error("Governance submit response missing approvalRequestId");
    }

    const beforeApproved = await searchAudit(request, {
      runId,
      eventType: "GovernanceApprovalApproved",
      take: "50",
      tenantId: tenantScope.tenantId,
      workspaceId: tenantScope.workspaceId,
      projectId: tenantScope.projectId,
    });
    const baselineApproved = beforeApproved.filter((e) => e.eventType === "GovernanceApprovalApproved").length;

    const [r1, r2] = await Promise.all([
      postGovernanceApproveRaw(
        request,
        approvalRequestId,
        { reviewedBy: "e2e-concurrent-approver-a", reviewComment: "parallel a" },
        undefined,
        tenantScope,
      ),
      postGovernanceApproveRaw(
        request,
        approvalRequestId,
        { reviewedBy: "e2e-concurrent-approver-b", reviewComment: "parallel b" },
        undefined,
        tenantScope,
      ),
    ]);

    expect(r1.status()).toBeLessThan(500);
    expect(r2.status()).toBeLessThan(500);

    const statuses = [r1.status(), r2.status()];
    const successes = statuses.filter((s) => s >= 200 && s < 300).length;

    expect(successes, "exactly one approve should win with 2xx").toBe(1);
    expect(statuses.some((s) => s >= 400 && s < 500), "loser should be a 4xx client error").toBe(true);

    const afterApproved = await searchAudit(request, {
      runId,
      eventType: "GovernanceApprovalApproved",
      take: "100",
      tenantId: tenantScope.tenantId,
      workspaceId: tenantScope.workspaceId,
      projectId: tenantScope.projectId,
    });
    const approvedCount = afterApproved.filter((e) => e.eventType === "GovernanceApprovalApproved").length;

    expect(approvedCount - baselineApproved, "single new GovernanceApprovalApproved").toBe(1);
  });
});
