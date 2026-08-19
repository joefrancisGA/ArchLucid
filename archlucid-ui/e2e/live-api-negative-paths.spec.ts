/**
 * Negative-path API checks (live ArchLucid.Api + Sql). Run:
 *   npx playwright test
 */
import { expect, test } from "@playwright/test";

import {
  commitRun,
  commitRunRaw,
  type CommitRunResponseJson,
  createApprovalRequest,
  createRun,
  executeRun,
  freshIsolatedTenantScope,
  getRunDetailsRaw,
  liveAcceptHeaders,
  liveApiBase,
  postArchitectureRequestRaw,
  postGovernanceApproveRaw,
  resolveLiveApiBase,
  resolveLiveAuthActorName,
  liveE2eArchitectureDescription,
  liveE2eArchitectureRunCyclePlaywrightTimeoutMs,
  liveE2eCommitWaitMs,
  searchAudit,
  waitForAuthorityRunSummaryReady,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";

function readProblemType(body: unknown): string {
  if (typeof body !== "object" || body === null) {
    return "";
  }

  const o = body as Record<string, unknown>;
  const t = o.type ?? o.Type;

  return typeof t === "string" ? t : "";
}

test.describe("live-api-negative-paths", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("governance self-approval blocked: submit then approve as same actor → 400 + audit", async ({
    request,
  }) => {
    // Shared live-API load: create→execute→commit plus governance can exceed the default 600s CI budget.
    test.setTimeout(Math.max(liveE2eArchitectureRunCyclePlaywrightTimeoutMs(), 900_000));

    const createBody = {
      requestId: `E2E-LIVE-SELF-APPR-${Date.now()}`,
      description: liveE2eArchitectureDescription(
        "Live E2E: governance self-approval must return 400 and emit GovernanceSelfApprovalBlocked.",
      ),
      systemName: "SelfApprovalTest",
      environment: "prod",
      cloudProvider: 1,
      constraints: [] as string[],
      requiredCapabilities: ["SQL"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const tenantScope = freshIsolatedTenantScope();

    const { runId } = await createRun(request, createBody, tenantScope);

    await executeRun(request, runId, tenantScope);
    await waitForReadyForCommit(request, runId, liveE2eCommitWaitMs(90_000), tenantScope);

    const commitJson = await commitRun(request, runId, tenantScope);
    const manifestVersion = commitJson.manifest?.metadata?.manifestVersion;

    if (!manifestVersion) {
      throw new Error("Commit response missing manifest.metadata.manifestVersion");
    }

    await waitForRunDetailCommitted(request, runId, liveE2eCommitWaitMs(90_000), tenantScope);
    await waitForAuthorityRunSummaryReady(request, runId, liveE2eCommitWaitMs(60_000), tenantScope);

    const submitted = await createApprovalRequest(
      request,
      {
        runId,
        manifestVersion,
        sourceEnvironment: "dev",
        targetEnvironment: "test",
        requestComment: "E2E self-approval negative path",
      },
      tenantScope,
    );

    const approvalRequestId = submitted.approvalRequestId;

    if (!approvalRequestId) {
      throw new Error("Governance submit response missing approvalRequestId");
    }

    const selfApprove = await postGovernanceApproveRaw(
      request,
      approvalRequestId,
      {
        reviewedBy: resolveLiveAuthActorName(),
        reviewComment: "same actor as submitter — must fail",
      },
      undefined,
      tenantScope,
    );

    expect(selfApprove.ok(), `self-approve expected 400, got ${selfApprove.status()}`).toBe(false);
    expect(selfApprove.status()).toBe(400);

    const problemBody: unknown = await selfApprove.json();
    const typeUri = readProblemType(problemBody);

    expect(typeUri, "problem type should reference governance-self-approval").toContain("#governance-self-approval");

    const auditEvents = await searchAudit(request, {
      runId,
      take: "200",
      tenantId: tenantScope.tenantId,
      workspaceId: tenantScope.workspaceId,
      projectId: tenantScope.projectId,
    });
    const types = new Set(auditEvents.map((e) => e.eventType).filter(Boolean) as string[]);

    expect(types.has("GovernanceSelfApprovalBlocked")).toBe(true);
  });

  test("GET run detail for unknown run id returns 404 with run-not-found problem type", async ({ request }) => {
    test.setTimeout(60_000);

    const fakeRunId = crypto.randomUUID();
    const res = await getRunDetailsRaw(request, fakeRunId);

    expect(res.status()).toBe(404);

    const problemBody: unknown = await res.json();
    const typeUri = readProblemType(problemBody);

    expect(typeUri).toContain("#run-not-found");
  });

  test("POST execute for unknown run id returns 404", async ({ request }) => {
    test.setTimeout(60_000);

    const res = await request.post(`${liveApiBase}/v1/architecture/review/${crypto.randomUUID()}/execute`, {
      headers: liveAcceptHeaders(),
    });

    expect(res.status()).toBe(404);
  });

  test("POST commit for unknown run id returns 404", async ({ request }) => {
    test.setTimeout(60_000);

    const res = await request.post(`${liveApiBase}/v1/architecture/review/${crypto.randomUUID()}/finalize`, {
      headers: liveAcceptHeaders(),
    });

    expect(res.status()).toBe(404);
  });

  test("GET run detail with malformed run id returns 400 or 404", async ({ request }) => {
    test.setTimeout(60_000);

    const res = await request.get(`${liveApiBase}/v1/architecture/review/not-a-guid`, {
      headers: liveAcceptHeaders(),
    });

    expect([400, 404]).toContain(res.status());
  });

  test("second commit on already-committed run is idempotent (200)", async ({ request }) => {
    test.setTimeout(liveE2eArchitectureRunCyclePlaywrightTimeoutMs());

    const createBody = {
      requestId: `E2E-LIVE-DBL-COMMIT-${Date.now()}`,
      description: liveE2eArchitectureDescription(
        "Live E2E: repeat commit after successful commit returns 200 with the same manifest (API_CONTRACTS idempotent commit).",
      ),
      systemName: "DoubleCommitNegative",
      environment: "prod",
      cloudProvider: 1,
      constraints: [] as string[],
      requiredCapabilities: ["SQL"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const tenantScope = freshIsolatedTenantScope();

    const { runId } = await createRun(request, createBody, tenantScope);

    await executeRun(request, runId, tenantScope);
    await waitForReadyForCommit(request, runId, 120_000, tenantScope);

    const firstCommit = await commitRun(request, runId, tenantScope);

    await waitForRunDetailCommitted(request, runId, 90_000, tenantScope);
    await waitForAuthorityRunSummaryReady(request, runId, 60_000, tenantScope);

    const firstManifestVersion = firstCommit.manifest?.metadata?.manifestVersion;

    expect(firstManifestVersion, "first commit should include manifest.metadata.manifestVersion").toBeTruthy();

    const second = await commitRunRaw(request, runId, tenantScope);

    expect(
      second.status(),
      "repeat POST commit on an already-committed run is idempotent (200) per docs/library/API_CONTRACTS.md",
    ).toBe(200);

    const secondBody = (await second.json()) as CommitRunResponseJson;

    expect(secondBody.manifest?.metadata?.manifestVersion).toBe(firstManifestVersion);
  });

  test("health ready with 1ms client timeout rejects (negative)", async ({ request }) => {
    test.setTimeout(30_000);

    await expect(request.get(`${resolveLiveApiBase()}/health/ready`, { timeout: 1 })).rejects.toThrow();
  });

  test("POST create run with empty JSON object returns 400 or 422", async ({ request }) => {
    test.setTimeout(60_000);

    const res = await postArchitectureRequestRaw(request, {});

    expect(res.ok(), `empty create body should fail, got ${res.status()}`).toBe(false);
    expect([400, 422]).toContain(res.status());
  });
});
