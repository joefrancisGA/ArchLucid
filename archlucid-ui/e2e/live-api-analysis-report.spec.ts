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
  getDocxArchitecturePackageExportRaw,
  liveApiBase,
  liveE2eArchitectureDescription,
  postAnalysisReportRaw,
  searchAudit,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";

test.describe("live-api-analysis-report", () => {
  const tenantScope = freshIsolatedTenantScope();

  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("generate analysis report for committed run and verify audit", async ({ request }) => {
    test.setTimeout(180_000);

    const createBody = {
      requestId: `E2E-LIVE-REPORT-${Date.now()}`,
      description: liveE2eArchitectureDescription("Live E2E: analysis report generation."),
      systemName: "AnalysisReportTest",
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

    const reportRes = await postAnalysisReportRaw(request, { runId }, tenantScope);

    if (reportRes.status() === 404) {
      test.skip(true, "Analysis report endpoint not available in this build");
      return;
    }

    expect(reportRes.ok(), `analysis report POST expected 2xx, got ${reportRes.status()}`).toBe(true);

    const reportBody: unknown = await reportRes.json();

    expect
      .soft(typeof reportBody === "object" && reportBody !== null, "report response should be an object")
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
      .soft(types.has("ArchitectureAnalysisReportGenerated"), "Expected ArchitectureAnalysisReportGenerated audit event")
      .toBe(true);

    const docxRes = await getDocxArchitecturePackageExportRaw(request, runId, tenantScope);

    if (docxRes.status() !== 404) {
      expect.soft(docxRes.ok(), `DOCX export expected 2xx, got ${docxRes.status()}`).toBe(true);

      if (docxRes.ok()) {
        const docxContentType = docxRes.headers()["content-type"] ?? "";

        expect
          .soft(
            docxContentType.includes("officedocument") || docxContentType.includes("octet-stream"),
            `DOCX content-type should be officedocument or octet-stream, got ${docxContentType}`,
          )
          .toBe(true);
      }
    }
  });
});
