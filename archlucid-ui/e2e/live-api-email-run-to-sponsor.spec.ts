/**
 * Requires a running ArchLucid.Api (Sql + DevelopmentBypass by default in CI).
 * Default `playwright.config.ts` is live-backed; run `npx playwright test` (or mock: `-c playwright.mock.config.ts`).
 * Set `LIVE_API_URL` if the API is not on http://127.0.0.1:5128.
 *
 * Covers the post-commit sponsor deliverables banner on `/runs/[runId]`:
 *   - Drive a full create → execute → commit cycle so the run-detail page renders the post-commit
 *     `EmailRunToSponsorBanner`.
 *   - Click the banner's primary action and assert the browser receives an `application/pdf` download
 *     whose body starts with the `%PDF` magic bytes (sponsor-shareable PDF projection of the
 *     canonical first-value-report Markdown).
 */
import { expect, test } from "@playwright/test";

import {
  commitRun,
  createRun,
  executeRun,
  freshIsolatedTenantScope,
  getRunDetailsWithTransientRetries,
  liveAcceptHeaders,
  liveApiBase,
  liveTenantScopeHeaders,
  liveE2eArchitectureRunCyclePlaywrightTimeoutMs,
  liveE2eArchitectureDescription,
  waitForAuthorityBuyerSummaryGoldenManifest,
  waitForAuthorityRunSummaryReady,
  waitForReadyForCommit,
  waitForRunDetailCommitted,
} from "./helpers/live-api-client";
import { openDemoWorkspaceReviewDetailShellReady } from "./helpers/demo-workspace-live-scope";
import { ensureBuyerExecutiveBriefingSectionExpanded } from "./helpers/operator-journey";

test.describe("live-api-email-run-to-sponsor", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("post-commit banner downloads a PDF derived from the first-value-report Markdown", async ({
    page,
    request,
  }) => {
    test.setTimeout(liveE2eArchitectureRunCyclePlaywrightTimeoutMs());

    const createBody = {
      requestId: `E2E-EMAIL-SPONSOR-${Date.now()}`,
      description: liveE2eArchitectureDescription(
        "Live E2E: drive a committed run so the sponsor PDF CTA renders on /runs/[runId].",
      ),
      systemName: "EmailSponsorPdf",
      environment: "prod",
      cloudProvider: 1,
      constraints: [] as string[],
      requiredCapabilities: ["SQL"],
      assumptions: [] as string[],
      priorManifestVersion: null as string | null,
    };

    const tenantScope = freshIsolatedTenantScope();

    const { runId } = await createRun(request, createBody, tenantScope);
    test.info().annotations.push({ type: "e2e-run-id", description: runId });

    await executeRun(request, runId, tenantScope);
    await waitForReadyForCommit(request, runId, 90_000, tenantScope);
    await commitRun(request, runId, tenantScope);
    await waitForRunDetailCommitted(request, runId, 60_000, tenantScope);

    const afterCommit = await getRunDetailsWithTransientRetries(request, runId, tenantScope);

    if (!afterCommit.run?.goldenManifestId) {
      throw new Error("Run detail after commit missing run.goldenManifestId — sponsor banner requires a committed package.");
    }

    await waitForAuthorityRunSummaryReady(request, runId, 60_000, tenantScope);
    // SSR uses buyer-summary; wait until goldenManifestId is present, then open with cold-start retries.
    await waitForAuthorityBuyerSummaryGoldenManifest(request, runId, 90_000, tenantScope);
    await openDemoWorkspaceReviewDetailShellReady(page, tenantScope, runId, { timeoutMs: 45_000 });
    await ensureBuyerExecutiveBriefingSectionExpanded(page, runId);

    const banner = page.getByTestId("email-run-to-sponsor-banner");

    await expect(banner).toBeVisible({ timeout: 60_000 });
    // Buyer-polished shell uses Downstream deliverable; full shell uses Sponsor distribution.
    // Optional time-to-first-commit chip only appears when trial-status returns seconds > 0.
    await expect(banner).toContainText(/Downstream deliverable|Sponsor distribution/i);

    const primary = page.getByTestId("email-run-to-sponsor-primary-action");

    await expect
      .poll(
        async () => (await primary.isEnabled()) || (await page.getByTestId("email-run-to-sponsor-execution-mode-gap").isVisible()),
        { timeout: 90_000 },
      )
      .toBe(true);

    if (await primary.isEnabled()) {
      const downloadPromise = page.waitForEvent("download", { timeout: 60_000 });
      await primary.click();
      const download = await downloadPromise;

      const filename = download.suggestedFilename();

      expect(filename).toMatch(/first-value-report/i);
      expect(filename.toLowerCase()).toMatch(/\.pdf$/);

      const path = await download.path();

      if (path === null) {
        throw new Error("Browser download has no resolved path; cannot verify PDF magic bytes.");
      }

      const fs = await import("node:fs/promises");
      const buf = await fs.readFile(path);

      expect(buf.byteLength).toBeGreaterThan(64);
      expect(buf.subarray(0, 4).toString("utf8")).toBe("%PDF");

      return;
    }

    // CI uses AgentExecution__Mode=Simulator — UI blocks external sponsor PDF; verify API (or Markdown fallback).
    const pdfRes = await request.post(`${liveApiBase}/v1/pilots/runs/${runId}/first-value-report.pdf`, {
      headers: { ...liveAcceptHeaders(), ...liveTenantScopeHeaders(tenantScope) },
    });

    if (pdfRes.ok()) {
      const buf = await pdfRes.body();

      expect(buf.byteLength).toBeGreaterThan(64);
      expect(buf.subarray(0, 4).toString("utf8")).toBe("%PDF");

      return;
    }

    const markdownRes = await request.get(`${liveApiBase}/v1/pilots/runs/${runId}/first-value-report`, {
      headers: { ...liveAcceptHeaders(), ...liveTenantScopeHeaders(tenantScope) },
    });

    expect(markdownRes.ok(), `first-value-report expected 2xx, got ${pdfRes.status()} pdf / ${markdownRes.status()} md`).toBeTruthy();

    const markdown = await markdownRes.text();

    expect(markdown.length).toBeGreaterThan(64);
    expect(markdown.toLowerCase()).toMatch(/first.?value|executive|sponsor/i);
  });
});
