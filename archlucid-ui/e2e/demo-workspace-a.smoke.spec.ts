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
import {
  countFindingsInAuthorityRunDetailPayload,
  getAuthorityRunDetailRaw,
  liveApiBase,
} from "./helpers/live-api-client";

const releaseGateTag = "@release-gate";

test.describe(`demo-workspace-a-smoke (${releaseGateTag})`, { tag: [releaseGateTag] }, () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 90_000 });

    expect(health.ok(), await health.text()).toBeTruthy();
  });

  test("canonical Product Tour reviewer shell loads with evidence, findings, finalized record, exports", async ({ page }) => {
    test.setTimeout(120_000);

    await injectDemoWorkspaceOperatorScope(page, DEMO_WORKSPACE_A_LIVE_IDS);
    await page.goto(`/reviews/${DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Run detail", level: 2 })).toBeVisible({ timeout: 90_000 });

    await expect(page.getByText(/Loading review detail/i)).toHaveCount(0, { timeout: 90_000 });

    await expect(page.getByText(/Review could not be loaded/i)).toHaveCount(0);

    const sectionNav = page.getByRole("navigation", { name: "Review detail sections" });

    await expect(sectionNav.getByRole("link", { name: "Outcome" })).toBeVisible();
    await expect(sectionNav.getByRole("link", { name: "Evidence" })).toBeVisible();
    await expect(sectionNav.getByRole("link", { name: "Assessment" })).toBeVisible();
    await expect(sectionNav.getByRole("link", { name: "Activity" })).toBeVisible();
    await expect(sectionNav.getByRole("link", { name: "Deliverables" })).toBeVisible();

    await expect(page.getByRole("heading", { name: /Recent lifecycle events|Pipeline timeline/i }).first()).toBeVisible({
      timeout: 60_000,
    });

    await page.locator("#trust-evidence").scrollIntoViewIfNeeded();

    const evidenceBasisTiles = page.locator("#trust-evidence .grid.gap-3 > div.rounded-lg");

    const minimumEvidenceTiles =
      demoWorkspacesFixtureManifest.workspaceA.minimumEvidenceBasisTiles ?? 5;

    await expect.poll(async () => evidenceBasisTiles.count(), { timeout: 60_000 }).toBeGreaterThanOrEqual(minimumEvidenceTiles);

    await page.locator("#run-explanation").scrollIntoViewIfNeeded();

    await expect(page.getByTestId("quick-decision-summary")).toBeVisible({ timeout: 60_000 });

    const severityBadge = page
      .getByTestId("quick-decision-summary")
      .getByText(/^Critical$|^High$|^Medium$/, { exact: true })
      .first();

    await expect(severityBadge).toBeVisible({ timeout: 30_000 });

    await page.locator("#manifest-summary").scrollIntoViewIfNeeded();

    await expect(page.getByRole("heading", { name: /Finalized decision record/i })).toBeVisible();

    const manifestSection = page.locator("#manifest-summary");

    await expect(manifestSection).toContainText("Finalized");

    await expect(manifestSection.getByRole("term", { name: "Decisions" })).toBeVisible();

    await page.locator("#artifacts-exports").scrollIntoViewIfNeeded();

    await expect(page.locator("#artifacts-exports").getByRole("link", { name: /Download evidence package/i })).toBeVisible();

    /** Affordance only — do not trigger Markdown download blob (release gate verifies control presence). */
    await expect(page.getByTestId("golden-manifest-markdown-download-button")).toBeVisible();
  });
});
