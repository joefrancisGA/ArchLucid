/**
 * Requires a running ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 * Run: npx playwright test
 */
import { expect, test } from "@playwright/test";

import {
  commitRun,
  createApprovalRequest,
  createRun,
  executeRun,
  liveApiBase,
  postGovernanceApproveRaw,
  postGovernanceRejectRaw,
  rejectGovernanceRequest,
  searchAudit,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";

const e2eRejectorActor = "e2e-rejector";

const liveRejectionForensics: { runId?: string; approvalRequestId?: string } = {};

test.describe("live-api-governance-rejection", () => {
  test.afterAll(() => {
    if (liveRejectionForensics.runId) {
      console.log(
        `[live-api-governance-rejection] runId=${liveRejectionForensics.runId} approvalRequestId=${liveRejectionForensics.approvalRequestId ?? ""}`,
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

  test("governance rejection: submit → reject → audit → UI; invalid transitions return 400", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const createBody = {
      requestId: `E2E-LIVE-REJECT-${Date.now()}`,
      description:
        "Live E2E governance rejection path: committed run with approval request rejected by a different actor.",
      systemName: "RejectTest",
      environment: "prod",
      cloudProvider: 1,
      constraints: [] as string[],
      requiredCapabilities: ["SQL"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const { runId } = await createRun(request, createBody);

    liveRejectionForensics.runId = runId;
    test.info().annotations.push({ type: "e2e-run-id", description: runId });

    await executeRun(request, runId);
    await waitForReadyForCommit(request, runId, 90_000);

    const commitJson = await commitRun(request, runId);
    const manifestVersion = commitJson.manifest?.metadata?.manifestVersion;

    if (!manifestVersion) {
      throw new Error("Commit response missing manifest.metadata.manifestVersion");
    }

    await waitForRunDetailCommitted(request, runId, 60_000);

    const submitted = await createApprovalRequest(request, {
      runId,
      manifestVersion,
      sourceEnvironment: "dev",
      targetEnvironment: "test",
      requestComment: "E2E live rejection path",
    });

    const approvalRequestId = submitted.approvalRequestId;

    if (!approvalRequestId) {
      throw new Error("Governance submit response missing approvalRequestId");
    }

    liveRejectionForensics.approvalRequestId = approvalRequestId;
    test.info().annotations.push({ type: "e2e-approval-request-id", description: approvalRequestId });

    const rejected = await rejectGovernanceRequest(request, approvalRequestId, {
      reviewedBy: e2eRejectorActor,
      reviewComment: "E2E rejection test",
    });

    expect(rejected.status).toBe("Rejected");

    const approveAfterReject = await postGovernanceApproveRaw(request, approvalRequestId, {
      reviewedBy: e2eRejectorActor,
      reviewComment: "should fail — already rejected",
    });

    expect.soft(approveAfterReject.ok(), `approve after reject should fail, got ${approveAfterReject.status()}`).toBe(
      false,
    );
    expect.soft(approveAfterReject.status()).toBe(400);

    const duplicateReject = await postGovernanceRejectRaw(request, approvalRequestId, {
      reviewedBy: e2eRejectorActor,
      reviewComment: "second reject should fail",
    });

    expect.soft(duplicateReject.ok(), `duplicate reject should fail, got ${duplicateReject.status()}`).toBe(false);
    expect.soft(duplicateReject.status()).toBe(400);

    const auditEvents = await searchAudit(request, { runId, take: "200" });

    const types = new Set(auditEvents.map((e) => e.eventType).filter(Boolean) as string[]);

    expect(types.has("GovernanceApprovalSubmitted"), "audit should include GovernanceApprovalSubmitted").toBe(true);
    expect(types.has("GovernanceApprovalRejected"), "audit should include GovernanceApprovalRejected").toBe(true);

    const rejectedEvents = auditEvents.filter((e) => e.eventType === "GovernanceApprovalRejected");

    for (const ev of rejectedEvents) {
      expect
        .soft(
          ev.correlationId != null && ev.correlationId.length > 0,
          "GovernanceApprovalRejected should carry correlationId",
        )
        .toBe(true);
    }

    await page.goto(`/governance?runId=${encodeURIComponent(runId)}`);

    await expect(page.getByRole("heading", { name: /governance workflow/i })).toBeVisible({
      timeout: 60_000,
    });

    await expect(page.locator("#gov-query-run")).toHaveValue(runId, { timeout: 15_000 });

    await page.getByRole("button", { name: /^Load$/i }).click();

    await expect(page.getByText(approvalRequestId).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Rejected").first()).toBeVisible({ timeout: 60_000 });
  });
});
