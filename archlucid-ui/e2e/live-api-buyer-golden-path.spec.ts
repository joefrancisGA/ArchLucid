/**
 * Live API buyer golden path (TB-289): five-step diligence spine against Sql + real API + seeded/static showcase run.
 */
import { expect, test } from "@playwright/test";

import { MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN } from "./fixtures";
import {
  BUYER_GOLDEN_PATH_HREFS,
  BUYER_SHOWCASE_AUDIT_TRAIL_HEADING,
  BUYER_SHOWCASE_EXECUTIVE_HEADLINE,
  BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN,
  expectBuyerGoldenJourneyStepper,
  expectNoGenericErrorBoundary,
} from "./helpers/buyer-golden-path";
import { askPageMainHeading, comparePageMainHeading, expectGraphPageReadySurface, governancePageMainHeading } from "./helpers/operator-journey";
import { liveApiBase } from "./helpers/live-api-client";

test.describe("live-api-buyer-golden-path", () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 90_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }
  });

  test("walks five-step diligence spine against live API without generic error @smoke @smoke-golden-path", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.executive);
    await expect(page.getByText("Executive summary", { exact: true }).first()).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: BUYER_SHOWCASE_EXECUTIVE_HEADLINE }),
    ).toBeVisible({ timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.reviewPackage);
    await expect(
      page.getByRole("heading", { level: 1 }).filter({ hasText: BUYER_SHOWCASE_REVIEW_PAGE_HEADING_PATTERN }),
    ).toBeVisible({ timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.signedManifestFriendly);
    await expect(page).toHaveURL(/\/reviews\/claims-intake-modernization\/manifest/);
    await expect(
      page.getByRole("main").getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN }).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.evidenceGraph);
    await expectGraphPageReadySurface(page, { timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.governanceApproval);
    await expect(governancePageMainHeading(page)).toBeVisible({ timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.auditTrail);
    await expect(
      page.getByRole("heading", { level: 2, name: BUYER_SHOWCASE_AUDIT_TRAIL_HEADING }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("audit-buyer-metric-tiles")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("audit-timeline-event-card").first()).toBeVisible({ timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.compare);
    await expect(comparePageMainHeading(page)).toBeVisible({ timeout: 60_000 });
    await expectNoGenericErrorBoundary(page);

    await page.goto(BUYER_GOLDEN_PATH_HREFS.ask);
    await expect(askPageMainHeading(page)).toBeVisible({ timeout: 60_000 });
    await expectNoGenericErrorBoundary(page);
  });
});
