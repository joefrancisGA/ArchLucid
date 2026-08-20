/**
 * Mock E2E: sequential walk of the Customer Intake buyer golden path (`buyer-golden-journey-nav.ts`).
 * Requires buyer-polished shell (`playwright.mock.config.ts` demo env flags).
 */
import { expect, test } from "@playwright/test";

import { MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN } from "./fixtures";
import {
  BUYER_GOLDEN_PATH_HREFS,
  BUYER_SHOWCASE_AUDIT_TRAIL_HEADING,
  BUYER_SHOWCASE_SPONSOR_HEADLINE,
  BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN,
  expectBuyerGoldenPageReady,
  expectBuyerGoldenJourneyStepper,
  expectBuyerSponsorReportSurface,
  expectNoGenericErrorBoundary,
  showcaseSignedManifestBrowserUrlPattern,
} from "./helpers/buyer-golden-path";
import { getAppMain } from "./helpers/app-main";
import { askPageMainHeading, comparePageMainHeading, expectGraphPageReadySurface, governancePageMainHeading } from "./helpers/operator-journey";

test.describe(
  "buyer golden path — Customer Intake spine",
  { tag: ["@founder", "@buyer-journey"] },
  () => {

  test("walks five-step diligence spine and satellite surfaces without generic error @smoke @smoke-golden-path", async ({
    page,
  }) => {
    test.setTimeout(150_000);
    // Step 1 — Sponsor report
    await page.goto(BUYER_GOLDEN_PATH_HREFS.sponsor);
    await expectBuyerSponsorReportSurface(page);
    await expect(
      page.getByRole("heading", { level: 1, name: BUYER_SHOWCASE_SPONSOR_HEADLINE }),
    ).toBeVisible();
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Review (between sponsor report and signed manifest on the spine)
    await page.goto(BUYER_GOLDEN_PATH_HREFS.reviewPackage);
    await expectBuyerGoldenPageReady(page);
    await expect(
      getAppMain(page).getByRole("heading", { level: 1 }).filter({ hasText: BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN }),
    ).toBeVisible({
      timeout: 60_000,
    });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Step 2 — Signed manifest (canonical governance detail)
    await page.goto(BUYER_GOLDEN_PATH_HREFS.signedManifestCanonical);
    await expect(page).toHaveURL(showcaseSignedManifestBrowserUrlPattern());
    await expect(
      getAppMain(page).getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN }).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Step 3 — Evidence trail (graph)
    await page.goto(BUYER_GOLDEN_PATH_HREFS.evidenceGraph);
    await expectGraphPageReadySurface(page, { timeout: 25_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Step 4 — Governance decision record
    await page.goto(BUYER_GOLDEN_PATH_HREFS.governanceApproval);
    await expect(governancePageMainHeading(page)).toBeVisible();
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Step 5 — Audit trail
    await page.goto(BUYER_GOLDEN_PATH_HREFS.auditTrail);
    await expect(page).toHaveURL(/\/audit\?runId=/);
    await expect(
      page.getByRole("heading", { level: 2, name: BUYER_SHOWCASE_AUDIT_TRAIL_HEADING }),
    ).toBeVisible();
    // Buyer-polished audit renders metric tiles and timeline cards together; assert each separately
    // because Playwright `.or()` strict mode fails when both locators match.
    await expect(page.getByTestId("audit-buyer-metric-tiles")).toBeVisible();
    await expect(page.getByTestId("audit-timeline-event-card").first()).toBeVisible();
    await expectNoGenericErrorBoundary(page);

    // Satellites — optional diligence surfaces linked from the layer strip / command palette
    await page.goto(BUYER_GOLDEN_PATH_HREFS.governanceFindings);
    await expect(
      getAppMain(page).getByTestId("architecture-risk-register-page-title"),
    ).toBeVisible();
    await expectNoGenericErrorBoundary(page);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.compare);
    await expect(comparePageMainHeading(page)).toBeVisible();
    await expectNoGenericErrorBoundary(page);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.ask);
    await expect(askPageMainHeading(page)).toBeVisible();
    await expectNoGenericErrorBoundary(page);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.policyPackDetail);
    await expect(
      page.getByRole("heading", { level: 1, name: /Healthcare Claims Policy Pack v/i }),
    ).toBeVisible();
    await expectNoGenericErrorBoundary(page);
  });
});
