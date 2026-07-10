/**
 * Live API buyer golden path (TB-289): five-step diligence spine against Sql + seeded Workspace A Product Tour run.
 * Showcase slug hrefs in `helpers/buyer-golden-path.ts` target mock/static operator builds; live CI uses pinned demo workspace IDs.
 */
import { expect, test } from "@playwright/test";

import { MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN } from "./fixtures";
import {
  expectBuyerExecutiveReviewPrimaryHeading,
  expectBuyerExecutiveSummarySurface,
  expectBuyerGoldenJourneyStepper,
  expectBuyerGoldenPageReady,
  expectBuyerReviewPackagePrimaryHeading,
  expectNoGenericErrorBoundary,
} from "./helpers/buyer-golden-path";
import {
  DEMO_WORKSPACE_A_LIVE_IDS,
  DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
  injectDemoWorkspaceOperatorScope,
} from "./helpers/demo-workspace-live-scope";
import { ensureDemoWorkspaceSeedReady } from "./helpers/ensure-demo-workspace-seed";
import { waitForLiveApiReady } from "./helpers/live-api-client";
import { getAppMain } from "./helpers/app-main";
import {
  askPageMainHeading,
  comparePageMainHeading,
  expectGraphPageReadySurface,
  governancePageMainHeading,
} from "./helpers/operator-journey";

const productTourRunId = DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID;
const productTourRunEnc = encodeURIComponent(productTourRunId);

const liveBuyerGoldenPathHrefs = {
  executive: `/reviews/${productTourRunEnc}`,
  reviewPackage: `/reviews/${productTourRunEnc}`,
  signedManifestFriendly: `/reviews/${productTourRunEnc}/signed-record`,
  evidenceGraph: `/graph?runId=${productTourRunEnc}`,
  governanceApproval: `/governance?runId=${productTourRunEnc}`,
  auditTrail: `/audit?runId=${productTourRunEnc}`,
  compare: `/compare?leftRunId=${productTourRunEnc}&rightRunId=${productTourRunEnc}`,
  ask: `/ask?runId=${productTourRunEnc}`,
} as const;

test.describe("live-api-buyer-golden-path", () => {
  test.beforeAll(async ({ request }) => {
    await waitForLiveApiReady(request);

    await ensureDemoWorkspaceSeedReady(request);
  });

  test("walks five-step diligence spine against live API without generic error @smoke @smoke-golden-path", async ({
    page,
  }) => {
    test.setTimeout(300_000);

    await injectDemoWorkspaceOperatorScope(page, DEMO_WORKSPACE_A_LIVE_IDS);

    await page.goto(liveBuyerGoldenPathHrefs.executive);
    await expectBuyerExecutiveSummarySurface(page);
    await expect(getAppMain(page)).toBeVisible({ timeout: 60_000 });
    await expectBuyerExecutiveReviewPrimaryHeading(page);
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(liveBuyerGoldenPathHrefs.reviewPackage);
    await expectBuyerGoldenPageReady(page);
    await expect(getAppMain(page)).toBeVisible({ timeout: 60_000 });
    await expectBuyerReviewPackagePrimaryHeading(page);
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(liveBuyerGoldenPathHrefs.signedManifestFriendly);
    await expect(
      getAppMain(page).getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN }).first(),
    ).toBeVisible({ timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(liveBuyerGoldenPathHrefs.evidenceGraph);
    await expectGraphPageReadySurface(page, { timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(liveBuyerGoldenPathHrefs.governanceApproval);
    await expect(governancePageMainHeading(page)).toBeVisible({ timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(liveBuyerGoldenPathHrefs.auditTrail);
    await expect(page.getByRole("heading", { level: 2, name: /Audit trail for/i })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("audit-buyer-metric-tiles")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("audit-timeline-event-card").first()).toBeVisible({ timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(liveBuyerGoldenPathHrefs.compare);
    await expect(comparePageMainHeading(page)).toBeVisible({ timeout: 60_000 });
    await expectNoGenericErrorBoundary(page);

    await page.goto(liveBuyerGoldenPathHrefs.ask);
    await expect(askPageMainHeading(page)).toBeVisible({ timeout: 60_000 });
    await expectNoGenericErrorBoundary(page);
  });
});
