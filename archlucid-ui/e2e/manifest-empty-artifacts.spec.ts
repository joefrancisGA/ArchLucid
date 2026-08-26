/**
 * Operator semantics (manifest detail):
 * - A **200 + `[]`** artifact list is a **valid empty catalog**: summary and bundle affordance still apply.
 * - That is **not** the same as an **artifact-list request failure** (warning callout + “could not be loaded”).
 * - Bundle download is a **separate** step: the empty-state copy notes the ZIP may still 404 at download time.
 */
import { expect, test } from "@playwright/test";

import { FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID, MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN } from "./fixtures";
import { gotoManifestEmptyArtifactsOperatorCase } from "./helpers/operator-journey";

test.describe("operator journey — manifest empty artifact list", () => {
  test("shows valid-empty state, operator copy, and bundle link (mock API only)", async ({ page }) => {
    await gotoManifestEmptyArtifactsOperatorCase(page);

    /**
     * Mock Playwright builds default to buyer-polished + demo-static (`playwright.mock.config.ts`):
     * page title becomes "Architecture review" (see `isBuyerPolishedOperatorShellEnv`).
     * Full-operator builds keep "Finalized Architecture Manifest".
     */
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN,
      }),
    ).toBeVisible();

    // Buyer-polished shell hides raw operatorSummary prose; assert stable empty-catalog chrome instead.
    await expect(page.getByText("Artifact list could not be loaded.", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Deliverables list could not be loaded.", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Artifact list response was not usable.", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Deliverables response was not usable.", { exact: true })).toHaveCount(0);

    const emptyRegion = page.getByTestId("manifest-deliverables-empty-state");
    await expect(emptyRegion).toBeVisible();
    await expect(
      emptyRegion.getByText(
        /valid empty result|Download is being prepared when your workspace publishes a bundle for this review/i,
      ),
    ).toBeVisible();
    await expect(
      emptyRegion.getByText(/Bundle ZIP may return 404|Download is being prepared when your workspace publishes a bundle/i),
    ).toBeVisible();

    // Buyer-polished shell: bundle CTA lives in collapsed `manifest-buyer-bundle-download` details.
    const buyerBundleDetails = page.getByTestId("manifest-buyer-bundle-download");

    if ((await buyerBundleDetails.count()) > 0) {
      await buyerBundleDetails.locator("summary").first().click();
    }

    const bundleLink = page
      .getByRole("link", {
        name:
          /^(Download bundle \(ZIP\)|Download evidence bundle \(ZIP\)|Download all files \(ZIP\)|Download full package \(ZIP\)|Download finalized review|Export manifest bundle)$/,
      })
      .first();
    await expect(bundleLink).toBeVisible();
    await expect(bundleLink).toHaveAttribute("href", new RegExp(encodeURIComponent(FIXTURE_MANIFEST_EMPTY_ARTIFACTS_ID)));
    await expect(bundleLink).toHaveAttribute("href", /bundle/);

    await expect(page.getByRole("columnheader", { name: "Artifact" })).toHaveCount(0);
  });
});
