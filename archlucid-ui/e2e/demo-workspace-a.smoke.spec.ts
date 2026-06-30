/**
 * Workspace A (Product Tour) — SQL-backed Development seed (`docs/go-to-market/DEMO_WORKSPACES.md`).
 * Merge-blocking `@release-gate`: `ci.yml` `ui-e2e-live`, `release-smoke.ps1 -LivePlaywright`.
 */
import { expect, test } from "@playwright/test";

import {
  DEMO_WORKSPACE_A_LIVE_IDS,
  DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
  injectDemoWorkspaceOperatorScope,
} from "./helpers/demo-workspace-live-scope";
import { demoWorkspacesFixtureManifest } from "./helpers/demo-workspaces-fixture-manifest";
import { ensureDemoWorkspaceSeedReady } from "./helpers/ensure-demo-workspace-seed";
import {
  countFindingsInAuthorityRunDetailPayload,
  getAuthorityRunDetailRaw,
  liveApiBase,
} from "./helpers/live-api-client";
import { expectRunDetailPageReady } from "./helpers/operator-journey";

const releaseGateTag = "@release-gate";

test.describe(`demo-workspace-a-smoke (${releaseGateTag})`, { tag: [releaseGateTag] }, () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 90_000 });

    expect(health.ok(), await health.text()).toBeTruthy();

    await ensureDemoWorkspaceSeedReady(request);
  });

  test("canonical Product Tour reviewer shell loads with evidence, findings, finalized record, exports", async ({ page }) => {
    test.setTimeout(300_000);

    await injectDemoWorkspaceOperatorScope(page, DEMO_WORKSPACE_A_LIVE_IDS);
    await page.goto(`/reviews/${DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID}`, { waitUntil: "domcontentloaded" });

    await expectRunDetailPageReady(page);

    const sectionNav = page.getByRole("navigation", { name: "Review detail sections" });

    await expect(sectionNav.getByRole("link", { name: "Decision", exact: true })).toBeVisible();
    await expect(sectionNav.getByRole("link", { name: "Evidence", exact: true })).toBeVisible();
    await expect(sectionNav.getByRole("link", { name: "Assessment", exact: true })).toBeVisible();
    await expect(sectionNav.getByRole("link", { name: "Activity", exact: true })).toBeVisible();
    await expect(sectionNav.getByRole("link", { name: "Deliverables", exact: true })).toBeVisible();

    await page.locator("#pipeline-timeline").scrollIntoViewIfNeeded();

    await expect(page.getByTestId("run-pipeline-timeline-collapsible")).toBeVisible({
      timeout: 60_000,
    });

    await page.locator("#trust-evidence").scrollIntoViewIfNeeded();

    const evidenceBasisTiles = page.locator("#trust-evidence .grid.gap-3 > div.rounded-lg");

    const minimumEvidenceTiles =
      demoWorkspacesFixtureManifest.workspaceA.minimumEvidenceBasisTiles ?? 5;

    await expect.poll(async () => evidenceBasisTiles.count(), { timeout: 60_000 }).toBeGreaterThanOrEqual(minimumEvidenceTiles);

    const assessmentSection = page.locator("#run-explanation");

    await expect(assessmentSection).toBeVisible({ timeout: 120_000 });
    await assessmentSection.scrollIntoViewIfNeeded();

    await expect(page.getByTestId("quick-decision-summary")).toBeVisible({ timeout: 120_000 });

    await expect(
      page.getByTestId("quick-decision-summary").getByText(/Container Apps external ingress exposes admin callbacks/i).first(),
    ).toBeVisible({ timeout: 60_000 });

    await expect(page.locator("#run-decision-summary")).toBeVisible({ timeout: 90_000 });
    await page.locator("#run-decision-summary").scrollIntoViewIfNeeded();
    await page.waitForLoadState("networkidle", { timeout: 30_000 });

    await expect(page.getByTestId("buyer-review-decision-summary")).toBeVisible({ timeout: 90_000 });

    await expect(page.getByTestId("buyer-review-status-headline")).toBeVisible({ timeout: 90_000 });

    await page.locator("#artifacts-exports").scrollIntoViewIfNeeded();

    await expect(page.locator("#artifacts-exports").getByRole("link", { name: /Download evidence package/i })).toBeVisible();

    /** Affordance only — do not trigger Markdown download blob (release gate verifies control presence). */
    await expect(page.getByTestId("golden-manifest-markdown-download-button")).toBeVisible();
  });
});
