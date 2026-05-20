/**
 * Mock E2E: sequential walk of the Claims Intake buyer golden path (`buyer-golden-journey-nav.ts`).
 * Requires buyer-polished shell (`playwright.mock.config.ts` demo env flags).
 */
import { expect, test } from "@playwright/test";

import { MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN } from "./fixtures";
import {
  BUYER_GOLDEN_PATH_HREFS,
  BUYER_SHOWCASE_AUDIT_TRAIL_HEADING,
  BUYER_SHOWCASE_EXECUTIVE_HEADLINE,
  BUYER_SHOWCASE_REVIEW_PACKAGE_HEADLINE,
  expectBuyerGoldenJourneyStepper,
  expectNoGenericErrorBoundary,
} from "./helpers/buyer-golden-path";
import { askPageMainHeading, comparePageMainHeading, governancePageMainHeading } from "./helpers/operator-journey";

test.describe("buyer golden path — Claims Intake spine", () => {
  test("walks five-step diligence spine and satellite surfaces without generic error @smoke @smoke-golden-path", async ({
    page,
  }) => {
    // Step 1 — Executive summary
    await page.goto(BUYER_GOLDEN_PATH_HREFS.executive);
    await expect(page.getByText("Executive summary", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: BUYER_SHOWCASE_EXECUTIVE_HEADLINE }),
    ).toBeVisible();
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Review package (between executive summary and signed manifest on the spine)
    await page.goto(BUYER_GOLDEN_PATH_HREFS.reviewPackage);
    await expect(
      page.getByRole("heading", { level: 1, name: BUYER_SHOWCASE_REVIEW_PACKAGE_HEADLINE }),
    ).toBeVisible();
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Step 2 — Signed manifest (friendly URL; rewrites to manifest detail implementation)
    await page.goto(BUYER_GOLDEN_PATH_HREFS.signedManifestFriendly);
    await expect(page).toHaveURL(/\/reviews\/claims-intake-modernization\/manifest/);
    await expect(page.getByRole("heading", { name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN })).toBeVisible();
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Step 3 — Evidence trail (graph)
    await page.goto(BUYER_GOLDEN_PATH_HREFS.evidenceGraph);
    await expect(
      page.getByRole("main").getByRole("heading", {
        level: 2,
        name: /Decision traceability graph|Evidence-to-decision graph|Review trail graph|Review evidence graph/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByTestId("graph-canvas-ready").or(page.getByRole("button", { name: /^Load graph$/i })),
    ).toBeVisible({ timeout: 25_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Step 4 — Governance decision record
    await page.goto(BUYER_GOLDEN_PATH_HREFS.governanceApproval);
    await expect(governancePageMainHeading(page)).toBeVisible();
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Step 5 — Audit trail
    await page.goto(BUYER_GOLDEN_PATH_HREFS.auditTrail);
    await expect(
      page.getByRole("heading", { level: 2, name: BUYER_SHOWCASE_AUDIT_TRAIL_HEADING }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId("audit-buyer-metric-tiles")
        .or(page.getByTestId("audit-timeline-event-card").first()),
    ).toBeVisible();
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // Satellites — optional diligence surfaces linked from the layer strip / command palette
    await page.goto(BUYER_GOLDEN_PATH_HREFS.governanceFindings);
    await expect(
      page.getByRole("heading", { level: 2, name: "Review records and dispositions" }),
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
