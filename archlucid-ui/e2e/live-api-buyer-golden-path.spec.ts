/**
 * Live API buyer golden path (TB-289): five-step diligence spine against Sql + seeded Workspace A Product Tour run.
 * Showcase slug hrefs in `helpers/buyer-golden-path.ts` target mock/static operator builds; live CI uses pinned demo workspace IDs.
 */
import { expect, test } from "@playwright/test";

import {
  expectBuyerSponsorReviewPrimaryHeading,
  expectBuyerSponsorReportSurface,
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
import { waitForAuthorityBuyerSummaryGoldenManifest, waitForLiveApiReady } from "./helpers/live-api-client";
import { getAppMain } from "./helpers/app-main";
import {
  waitForLiveAuthorityRunDetailResponse,
  waitForLiveOperatorPageHydration,
} from "./helpers/live-page-readiness";
import {
  askPageMainHeading,
  auditPageMainHeading,
  comparePageMainHeading,
  expectGraphPageReadySurface,
  expectLiveManifestDetailPageReady,
  governancePageMainHeading,
} from "./helpers/operator-journey";

const productTourRunId = DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID;
const productTourRunEnc = encodeURIComponent(productTourRunId);

const liveBuyerGoldenPathHrefs = {
  sponsor: `/architecture/reviews/${productTourRunEnc}`,
  reviewPackage: `/architecture/reviews/${productTourRunEnc}`,
  evidenceGraph: `/insights/evidence-graph?runId=${productTourRunEnc}`,
  governanceApproval: `/governance/approval-queue?runId=${productTourRunEnc}`,
  auditTrail: `/governance/audit?runId=${productTourRunEnc}`,
  compare: `/insights/compare-two-reviews?leftRunId=${productTourRunEnc}&rightRunId=${productTourRunEnc}`,
  ask: `/insights/ask-review-questions?runId=${productTourRunEnc}`,
} as const;

let liveProductTourGoldenManifestId = "";

function liveSignedManifestHref(manifestId: string): string {
  return `/signed-records/${encodeURIComponent(manifestId)}`;
}

test.describe(
  "live-api-buyer-golden-path",
  { tag: ["@founder", "@critical", "@buyer-journey"] },
  () => {

  test.beforeAll(async ({ request }) => {
    await waitForLiveApiReady(request);

    await ensureDemoWorkspaceSeedReady(request);

    liveProductTourGoldenManifestId = await waitForAuthorityBuyerSummaryGoldenManifest(
      request,
      DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
      90_000,
      DEMO_WORKSPACE_A_LIVE_IDS,
    );
  });

  test("walks five-step diligence spine against live API without generic error @smoke @smoke-golden-path", async ({
    page,
  }) => {
    test.setTimeout(300_000);

    await injectDemoWorkspaceOperatorScope(page, DEMO_WORKSPACE_A_LIVE_IDS);

    await page.goto(liveBuyerGoldenPathHrefs.sponsor);
    await waitForLiveOperatorPageHydration(page);
    await waitForLiveAuthorityRunDetailResponse(page, productTourRunId);
    await expectBuyerSponsorReportSurface(page);
    await expect(getAppMain(page)).toBeVisible({ timeout: 90_000 });
    await expectBuyerSponsorReviewPrimaryHeading(page, { timeout: 90_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(liveBuyerGoldenPathHrefs.reviewPackage);
    await waitForLiveOperatorPageHydration(page);
    await waitForLiveAuthorityRunDetailResponse(page, productTourRunId);
    await expectBuyerGoldenPageReady(page);
    await expect(getAppMain(page)).toBeVisible({ timeout: 90_000 });
    await expectBuyerReviewPackagePrimaryHeading(page, { timeout: 90_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    // GUID `/architecture/reviews/{id}/signed-record` rewrites to review detail — canonical manifest route uses seeded goldenManifestId.
    await page.goto(liveSignedManifestHref(liveProductTourGoldenManifestId));
    await waitForLiveOperatorPageHydration(page);
    await expectLiveManifestDetailPageReady(page, liveProductTourGoldenManifestId, { timeoutMs: 90_000 });
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
    await waitForLiveOperatorPageHydration(page);
    await expect(auditPageMainHeading(page)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("audit-page-title")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("audit-buyer-metric-tiles")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("audit-timeline-event-card").first()).toBeVisible({ timeout: 60_000 });
    await expectBuyerGoldenJourneyStepper(page);
    await expectNoGenericErrorBoundary(page);

    await page.goto(liveBuyerGoldenPathHrefs.compare);
    await expect(comparePageMainHeading(page)).toBeVisible({ timeout: 60_000 });
    await expectNoGenericErrorBoundary(page);

    await page.goto(liveBuyerGoldenPathHrefs.ask);
    await waitForLiveOperatorPageHydration(page);
    await expect(askPageMainHeading(page)).toBeVisible({ timeout: 60_000 });
    await expectNoGenericErrorBoundary(page);
  });
});
