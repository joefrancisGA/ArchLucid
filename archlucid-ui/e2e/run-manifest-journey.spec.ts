/**
 * Mock E2E uses buyer-polished shell by default (`playwright.mock.config.ts` → `NEXT_PUBLIC_DEMO_MODE`).
 * Buyer run detail uses {@link RunDetailOutcomeCards}’s `PackageStatusStrip`: the manifest deep link is under
 * **Review outcome** with visible text **Finalized** (not the full-operator “Open manifest detail” card).
 * Do not assert `h2` **Run detail** here — that chrome is for full-operator / live API E2E only; buyer shell uses
 * {@link RunDetailPageHeader} `h1` from `buyerFacingReviewTitleFromSummary` (fixture description text).
 */
import { expect, test } from "@playwright/test";

import { FIXTURE_MANIFEST_ID, FIXTURE_RUN_ID } from "./fixtures";
import { gotoRunDetailForMockFixtureRun } from "./helpers/operator-journey";

test.describe("operator journey — run detail to manifest and back", () => {
  test("reviews fixture run, opens manifest, returns to run (mock API only)", async ({ page }) => {
    await gotoRunDetailForMockFixtureRun(page);

    await expect(page).toHaveURL(new RegExp(encodeURIComponent(FIXTURE_RUN_ID)));

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Claims Intake Modernization — integration boundaries/i,
      }),
    ).toBeVisible();

    const outcomeStrip = page.locator('section[aria-label="Review outcome summary"]');
    const manifestLink = outcomeStrip.locator(`a[href="/manifests/${FIXTURE_MANIFEST_ID}"]`);

    await expect(manifestLink).toBeVisible();
    await expect(manifestLink).toContainText("Finalized");
    await Promise.all([
      page.waitForURL(`**/manifests/${FIXTURE_MANIFEST_ID}**`, { waitUntil: "commit" }),
      manifestLink.click(),
    ]);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /^(Architecture review package|Finalized Architecture Manifest)$/,
      }),
    ).toBeVisible();

    await page.getByText("Verification appendix (identifiers)", { exact: true }).click();
    await expect(page.getByText(FIXTURE_MANIFEST_ID)).toBeVisible();

    await expect(
      page.getByText(/Finalized reviewed manifest for Claims Intake Modernization/),
    ).toBeVisible();

    await expect(page.getByText("At a glance", { exact: true })).toBeVisible();

    await Promise.all([
      page.waitForURL(`**/reviews/${FIXTURE_RUN_ID}**`, { waitUntil: "commit" }),
      page.getByRole("link", { name: "Open review" }).click(),
    ]);

    await expect(page).toHaveURL(new RegExp(encodeURIComponent(FIXTURE_RUN_ID)));
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Claims Intake Modernization — integration boundaries/i,
      }),
    ).toBeVisible();

    // Buyer-polished run detail uses {@link BuyerDeliverablesArtifactTabs}; `FIXTURE_MANIFEST_ID` artifacts
    // (`MarkdownNarrative` → other, `MermaidDiagram` → architects) both appear under the ARB tab only.
    await page.getByRole("tab", { name: "Architecture review board artifacts" }).click();

    const deliverablesRegion = page.getByRole("region", { name: "Deliverables grouped by audience" });

    await expect(deliverablesRegion.getByRole("columnheader", { name: "Output" })).toHaveCount(2);
    await expect(deliverablesRegion.getByText("Markdown Narrative", { exact: true }).first()).toBeVisible();
    await expect(deliverablesRegion.getByText("Intake context diagram", { exact: true }).first()).toBeVisible();

    await expect(page.getByRole("link", { name: "Download evidence package" })).toBeVisible();
  });
});
