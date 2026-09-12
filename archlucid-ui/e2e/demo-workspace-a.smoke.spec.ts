/**
 * Workspace A (Product Tour) — SQL-backed Development seed (`docs/go-to-market/DEMO_WORKSPACES.md`).
 * Merge-blocking `@release-gate`: `ci.yml` `ui-e2e-live`, `release-smoke.ps1 -LivePlaywright`.
 */
import { expect, test } from "@playwright/test";

import {
  DEMO_WORKSPACE_A_LIVE_IDS,
  DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
  openDemoWorkspaceReviewDetailShellReady,
} from "./helpers/demo-workspace-live-scope";
import { demoWorkspacesFixtureManifest } from "./helpers/demo-workspaces-fixture-manifest";
import { liveApiBase, waitForAuthorityBuyerSummaryGoldenManifest } from "./helpers/live-api-client";
import {
  ensureBuyerDeliverablesSectionExpanded,
  expectBuyerPipelineTimelineSectionVisible,
  expectBuyerPolishedReviewDetailWorkspaceCore,
  expectQuickDecisionSeverityVisible,
  openReviewDetailWorkspaceTab,
} from "./helpers/operator-journey";
import { ensureDemoWorkspaceSeedReady } from "./helpers/ensure-demo-workspace-seed";

const releaseGateTag = "@release-gate";

test.describe(
  `demo-workspace-a-smoke (${releaseGateTag})`,
  { tag: [releaseGateTag, "@founder", "@critical", "@buyer-journey"] },
  () => {

  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 90_000 });

    expect(health.ok(), await health.text()).toBeTruthy();

    await ensureDemoWorkspaceSeedReady(request, { workspaces: ["A"] });
  });

  test("canonical Product Tour reviewer shell loads with evidence, findings, finalized record, exports", async ({
    page,
    request,
  }) => {
    test.setTimeout(240_000);

    await waitForAuthorityBuyerSummaryGoldenManifest(
      request,
      DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
      90_000,
      DEMO_WORKSPACE_A_LIVE_IDS,
    );

    await openDemoWorkspaceReviewDetailShellReady(
      page,
      DEMO_WORKSPACE_A_LIVE_IDS,
      DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
    );
    await expectBuyerPolishedReviewDetailWorkspaceCore(page);

    await expect(page.getByTestId("run-detail-package-spine-export-co-location")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("run-scoped-audit-export-button")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("run-scoped-audit-export-dual-channel-honesty")).toBeVisible({
      timeout: 60_000,
    });

    await openReviewDetailWorkspaceTab(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID, "policies");
    await expect(page.getByTestId("review-detail-policy-pack-impact-callout")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("run-detail-first-review-spine-pack-delta-demo-link")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByTestId("policy-pack-influence-honesty-chip")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("run-detail-first-review-spine-semantic-support")).toBeVisible({
      timeout: 60_000,
    });

    await openReviewDetailWorkspaceTab(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID, "findings");

    await expect(page.getByTestId("quick-decision-summary")).toBeVisible({ timeout: 90_000 });

    await expectBuyerPipelineTimelineSectionVisible(page, {
      timeoutMs: 60_000,
      runId: DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
    });

    await openReviewDetailWorkspaceTab(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID, "evidence");

    await page.locator("#trust-evidence").scrollIntoViewIfNeeded();

    const evidenceBasisTiles = page.locator("#trust-evidence .grid.gap-3 > div.rounded-lg");

    const minimumEvidenceTiles =
      demoWorkspacesFixtureManifest.workspaceA.minimumEvidenceBasisTiles ?? 5;

    await expect.poll(async () => evidenceBasisTiles.count(), { timeout: 60_000 }).toBeGreaterThanOrEqual(minimumEvidenceTiles);

    const quickSummary = page.getByTestId("quick-decision-summary");

    await openReviewDetailWorkspaceTab(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID, "findings");

    await expectQuickDecisionSeverityVisible(quickSummary, { timeoutMs: 30_000 });

    const primaryCard = quickSummary.locator('[data-finding-workspace-primary="true"]');
    await expect(primaryCard).toBeVisible({ timeout: 60_000 });
    await primaryCard.scrollIntoViewIfNeeded();
    await expect(primaryCard.locator('[data-testid^="finding-classification-chip-"]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(primaryCard.getByText(/Policy-mapped or insight-density-promoted/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(primaryCard.getByTestId("working-finding-semantic-support-band")).toBeVisible({
      timeout: 30_000,
    });
    const semanticBand = primaryCard.getByTestId("working-finding-semantic-support-band");
    await expect(semanticBand).toContainText(/async|Lane B|sealed review/i, { timeout: 30_000 });

    await openReviewDetailWorkspaceTab(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID, "policies");

    const manifestSection = page.locator("#manifest-summary");

    await expect(manifestSection).toBeVisible({ timeout: 90_000 });
    await manifestSection.scrollIntoViewIfNeeded();

    await expect(page.getByRole("heading", { name: /Sealed review record/i })).toBeVisible({ timeout: 60_000 });
    await expect(manifestSection).toContainText("Finalized", { timeout: 60_000 });

    const manifestDecisionCount = manifestSection.getByTestId("run-detail-manifest-decision-count");

    await manifestDecisionCount.scrollIntoViewIfNeeded();
    await expect(manifestDecisionCount).toBeVisible({ timeout: 60_000 });
    await expect(manifestDecisionCount).not.toHaveText("—", { timeout: 60_000 });

    await ensureBuyerDeliverablesSectionExpanded(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID);

    await expect(page.locator("#artifacts-exports").getByRole("link", { name: /Download evidence bundle/i })).toBeVisible({
      timeout: 60_000,
    });

    /** Affordance only — do not trigger Markdown download blob (release gate verifies control presence). */
    await expect(
      page.locator("#artifacts-exports").getByTestId("golden-manifest-markdown-download-button"),
    ).toBeVisible();
  });

  test("Working career gravity honesty on stamp band (CG-046 / CG-076)", async ({ page, request }) => {
    test.setTimeout(240_000);

    await page.addInitScript(() => {
      window.localStorage.setItem("archlucid.workspace-mode.v1.personal", "working");
    });

    await waitForAuthorityBuyerSummaryGoldenManifest(
      request,
      DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
      90_000,
      DEMO_WORKSPACE_A_LIVE_IDS,
    );

    await openDemoWorkspaceReviewDetailShellReady(
      page,
      DEMO_WORKSPACE_A_LIVE_IDS,
      DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
    );

    await openReviewDetailWorkspaceTab(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID, "policies");

    const stampViewport = page.getByTestId("run-detail-review-package-stamp-viewport");

    await expect(stampViewport).toBeVisible({ timeout: 60_000 });
    await stampViewport.scrollIntoViewIfNeeded();

    await expect(page.getByTestId("run-detail-quality-gate-mode-strip")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("run-detail-stamp-semantic-support-band-summary")).toBeVisible({
      timeout: 60_000,
    });
    const stampLaneBHonesty = page.getByTestId("run-detail-stamp-semantic-support-lane-b-honesty");

    if (await stampLaneBHonesty.isVisible()) {
      await expect(stampLaneBHonesty).toContainText(/async|may lag/i);
    }

    await expect(page.getByTestId("run-detail-pre-finalize-honesty-strip-group")).toBeVisible({
      timeout: 60_000,
    });

    const simulatorCareerStrip = page.getByTestId("run-detail-pre-finalize-simulator-career-honesty-strip");
    const rehearsalDoorStrip = page.getByTestId("run-detail-pre-finalize-rehearsal-door-honesty-strip");

    if (await simulatorCareerStrip.isVisible()) {
      await expect(simulatorCareerStrip).toContainText("Simulator cannot read as career-complete");
    } else if (await rehearsalDoorStrip.isVisible()) {
      await expect(rehearsalDoorStrip).toContainText(/rehearsal/i);
    }

    await ensureBuyerDeliverablesSectionExpanded(page, DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID);
    await expect(page.getByTestId("golden-manifest-markdown-download-button")).toBeVisible({ timeout: 60_000 });
  });
});
