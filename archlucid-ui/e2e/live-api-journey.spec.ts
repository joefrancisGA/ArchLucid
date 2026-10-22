/**
 * Requires a running ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 * Default `playwright.config.ts` is live-backed; run `npx playwright test` (or mock: `-c playwright.mock.config.ts`).
 * Set `LIVE_API_URL` if the API is not on http://127.0.0.1:5128.
 */
import { expect, test } from "@playwright/test";

import {
  approveGovernanceRequest,
  commitRun,
  createApprovalRequest,
  createRun,
  executeRun,
  freshIsolatedTenantScope,
  getRunDetailsWithTransientRetries,
  getRunExportZip,
  listArchitectureRuns,
  liveApiBase,
  liveE2eArchitectureRunCyclePlaywrightTimeoutMs,
  liveBypassSubmitterGovernanceOptions,
  livePeerReviewerActorName,
  resolveLivePeerReviewerGovernanceOptions,
  normalizeRunIdForCompare,
  resolveLiveAuthActorName,
  resolveLiveAuthMode,
  waitForArchitectureRunListCommitted,
  waitForAuthorityBuyerSummaryGoldenManifest,
  waitForAuthorityManifestSummaryReady,
  waitForAuthorityRunSummaryReady,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
  postGovernanceApproveRaw,
  searchAudit,
} from "./helpers/live-api-client";
import { openDemoWorkspaceReviewDetailShellReady } from "./helpers/demo-workspace-live-scope";
import {
  auditPageMainHeading,
  clickAuditSearchAndWaitForSuccessfulResponse,
  expandAuditBuyerFiltersIfPresent,
  expectLiveManifestDetailPageReady,
  expectLiveRunDetailPageReady,
  expectFinalizedManifestLinkVisible,
  expectGovernanceRunWorkflowVisible,
  gotoLiveRunDetailPage,
  governancePageMainHeading,
  openReviewDetailWorkspaceTab,
} from "./helpers/operator-journey";

const liveE2eForensics: { runId?: string; approvalRequestId?: string; auditCorrelationId?: string } = {};

test.describe("live-api-journey", { tag: ["@founder", "@critical"] }, () => {
  test.afterAll(() => {
    if (liveE2eForensics.runId) {
      console.log(
        `[live-api-journey] runId=${liveE2eForensics.runId} approvalRequestId=${liveE2eForensics.approvalRequestId ?? ""} auditCorrelationId=${liveE2eForensics.auditCorrelationId ?? ""}`,
      );
    }
  });

  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("operator happy path: create → execute → commit → manifest → export → governance → audit", async ({
    page,
    request,
  }) => {
    // Polling alone can use 90s + 60s + 90s (doubled in CI); UI steps add more.
    test.setTimeout(liveE2eArchitectureRunCyclePlaywrightTimeoutMs());

    const createBody = {
      requestId: `E2E-LIVE-${Date.now()}`,
      description:
        "Design a secure Azure RAG system for enterprise internal documents using Azure AI Search, managed identity, private endpoints, SQL metadata storage, and moderate cost sensitivity.",
      systemName: "EnterpriseRag",
      environment: "prod",
      cloudProvider: 1,
      constraints: ["Private endpoints required", "Use managed identity"],
      requiredCapabilities: ["Azure AI Search", "SQL", "Managed Identity", "Private Networking"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const tenantScope = freshIsolatedTenantScope();

    const { runId } = await createRun(request, createBody, tenantScope);

    liveE2eForensics.runId = runId;
    test.info().annotations.push({ type: "e2e-run-id", description: runId });

    await executeRun(request, runId, tenantScope);

    await waitForReadyForCommit(request, runId, 90_000, tenantScope);

    const commitJson = await commitRun(request, runId, tenantScope);
    const manifestVersion = commitJson.manifest?.metadata?.manifestVersion;

    if (!manifestVersion) {
      throw new Error("Commit response missing manifest.metadata.manifestVersion");
    }

    await waitForRunDetailCommitted(request, runId, 60_000, tenantScope);

    const afterCommit = await getRunDetailsWithTransientRetries(request, runId, tenantScope);
    const goldenManifestId = afterCommit.run?.goldenManifestId;

    if (!goldenManifestId) {
      throw new Error("Run detail after commit missing run.goldenManifestId");
    }

    await waitForAuthorityRunSummaryReady(request, runId, 60_000, tenantScope);

    const authorityGoldenManifestId = await waitForAuthorityBuyerSummaryGoldenManifest(
      request,
      runId,
      60_000,
      tenantScope,
    );

    if (normalizeRunIdForCompare(authorityGoldenManifestId) !== normalizeRunIdForCompare(goldenManifestId)) {
      throw new Error(
        `Authority buyer-summary goldenManifestId (${authorityGoldenManifestId}) disagrees with architecture run detail (${goldenManifestId})`,
      );
    }

    await waitForAuthorityManifestSummaryReady(request, goldenManifestId, 90_000, tenantScope);

    // `live-api-journey.spec.ts` also runs under the ApiKey and JWT CI jobs (see
    // `.github/workflows/ci.yml`), which don't support `x-tenant-id`-header scope overrides (ApiKey CI
    // keys carry no bound `tenant_id` claim → 403 via `ScopeIdentityBindingMiddleware`; JWT resolves
    // scope from token claims). `mergeTenantScope` already no-ops the `request`-side headers outside
    // `DevelopmentBypass`, but browser-side `localStorage` scope injection has no such gate, so it's
    // skipped explicitly outside bypass mode to avoid the proxy forwarding the same forbidden header.
    // Call at use site (not module load) — the auth lane can change between import and test run.
    if (resolveLiveAuthMode() === "bypass") {
      // SSR uses buyer-summary; cold-start retries re-seed scope cookie between attempts.
      await openDemoWorkspaceReviewDetailShellReady(page, tenantScope, runId, { timeoutMs: 45_000 });
    } else {
      await gotoLiveRunDetailPage(page, runId);
      await expectLiveRunDetailPageReady(page, 120_000);
    }

    await openReviewDetailWorkspaceTab(page, runId, "activity");

    const manifestLink = await expectFinalizedManifestLinkVisible(page, {
      runId,
      timeoutMs: 120_000,
    });

    await Promise.all([
      page.waitForURL(/\/(?:signed-records|manifests)\/.+/i, { waitUntil: "commit" }),
      manifestLink.click(),
    ]);

    await expectLiveManifestDetailPageReady(page, goldenManifestId, { timeoutMs: 120_000 });

    const exportRes = await getRunExportZip(request, runId, tenantScope);

    expect(exportRes.ok(), `GET run export expected 200, got ${exportRes.status()}`).toBeTruthy();

    const exportCt = exportRes.headers()["content-type"] ?? "";

    expect(
      exportCt.includes("application/zip") || exportCt.includes("octet-stream"),
      `export content-type unexpected: ${exportCt}`,
    ).toBeTruthy();

    const exportBody = await exportRes.body();

    expect(exportBody.length).toBeGreaterThan(0);

    await waitForAuthorityRunSummaryReady(request, runId, 60_000, tenantScope);

    const submitted = await createApprovalRequest(
      request,
      {
        runId,
        manifestVersion,
        sourceEnvironment: "dev",
        targetEnvironment: "test",
        requestComment: "E2E live happy path",
      },
      tenantScope,
    );

    const approvalRequestId = submitted.approvalRequestId;

    if (!approvalRequestId) {
      throw new Error("Governance submit response missing approvalRequestId");
    }

    liveE2eForensics.approvalRequestId = approvalRequestId;
    test.info().annotations.push({ type: "e2e-approval-request-id", description: approvalRequestId });

    const selfApprovalRes = await postGovernanceApproveRaw(
      request,
      approvalRequestId,
      {
        reviewedBy: resolveLiveAuthActorName(),
        reviewComment: "should be blocked (same as submitter)",
      },
      resolveLiveAuthMode() === "bypass" ? liveBypassSubmitterGovernanceOptions : undefined,
      tenantScope,
    );

    expect.soft(selfApprovalRes.ok(), `self-approval should fail, got ${selfApprovalRes.status()}`).toBe(false);
    expect.soft(selfApprovalRes.status()).toBe(400);

    const approved = await approveGovernanceRequest(
      request,
      approvalRequestId,
      {
        reviewedBy: livePeerReviewerActorName,
        reviewComment: "E2E test auto-approve",
      },
      resolveLivePeerReviewerGovernanceOptions(),
      tenantScope,
    );

    expect(approved.status).toBe("Approved");

    const duplicateApprove = await postGovernanceApproveRaw(
      request,
      approvalRequestId,
      {
        reviewedBy: livePeerReviewerActorName,
        reviewComment: "second approve should fail",
      },
      resolveLivePeerReviewerGovernanceOptions(),
      tenantScope,
    );

    expect.soft(duplicateApprove.ok(), `duplicate approve should fail, got ${duplicateApprove.status()}`).toBe(false);
    expect.soft(duplicateApprove.status()).toBe(409);

    const auditEvents = await searchAudit(request, {
      runId,
      take: "100",
      tenantId: tenantScope.tenantId,
      workspaceId: tenantScope.workspaceId,
      projectId: tenantScope.projectId,
    });

    const governanceAuditTypes = new Set(["GovernanceApprovalSubmitted", "GovernanceApprovalApproved"]);

    for (const ev of auditEvents) {
      if (!ev.eventType || !governanceAuditTypes.has(ev.eventType)) {
        continue;
      }

      expect
        .soft(ev.correlationId != null && ev.correlationId.length > 0, `audit event ${ev.eventType} should have correlationId`)
        .toBe(true);
    }

    const firstCorrelation = auditEvents.find((e) => e.correlationId != null && e.correlationId.length > 0)?.correlationId;

    if (firstCorrelation) {
      liveE2eForensics.auditCorrelationId = firstCorrelation;
      test.info().annotations.push({ type: "e2e-audit-correlation-id", description: firstCorrelation });

      const byCorrelation = await searchAudit(request, {
        correlationId: firstCorrelation,
        take: "100",
        tenantId: tenantScope.tenantId,
        workspaceId: tenantScope.workspaceId,
        projectId: tenantScope.projectId,
      });

      expect.soft(byCorrelation.length, "audit search by correlationId should return at least one row").toBeGreaterThan(0);
    }

    const types = new Set(auditEvents.map((e) => e.eventType).filter(Boolean) as string[]);

    const required = [
      "RunStarted",
      "ManifestGenerated",
      "GovernanceApprovalSubmitted",
      "GovernanceApprovalApproved",
      "RunExported",
    ];
    const missing = required.filter((t) => !types.has(t));

    if (missing.length > 0) {
      throw new Error(
        `Missing audit event types: ${missing.join(", ")}. Found: ${[...types].sort().join(", ")}`,
      );
    }

    await waitForArchitectureRunListCommitted(request, runId, 90_000, tenantScope);

    const runsList = await listArchitectureRuns(request, tenantScope);
    const listed = runsList.find((r) => r.runId === runId);

    expect(listed, `run ${runId} should appear in GET /v1/architecture/runs`).toBeTruthy();
    expect.soft(listed?.status).toMatch(/^committed$/i);

    await page.goto(`/governance/approval-queue?runId=${encodeURIComponent(runId)}`);

    await expect(governancePageMainHeading(page)).toBeVisible({
      timeout: 60_000,
    });

    await expectGovernanceRunWorkflowVisible(page, approvalRequestId, "Approved");

    await page.goto("/governance/audit");

    await expect(auditPageMainHeading(page)).toBeVisible({ timeout: 30_000 });

    await expandAuditBuyerFiltersIfPresent(page);

    const reviewIdInput = page.getByTestId("audit-review-id-input");

    await expect(reviewIdInput).toBeVisible({ timeout: 60_000 });
    await reviewIdInput.fill(runId);
    await clickAuditSearchAndWaitForSuccessfulResponse(page, { runId, timeoutMs: 90_000 });

    await expect(page.locator('[role="alert"]').filter({ hasText: /problem|error|failed/i })).toHaveCount(0, {
      timeout: 60_000,
    });
  });
});
