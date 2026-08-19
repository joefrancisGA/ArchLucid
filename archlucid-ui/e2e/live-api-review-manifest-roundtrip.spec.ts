/**
 * Requires ArchLucid.Api + SQL (DevelopmentBypass in default CI live lane).
 *
 * Parity with mock `run-manifest-journey.spec.ts`: canonical showcase review → outcome **Finalized** manifest deep link
 * → manifest detail → back-to-review link (live proxy rather than `/api/proxy` mock).
 */
import { expect, test } from "@playwright/test";

import { MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN } from "./fixtures";
import { getAppMain } from "./helpers/app-main";
import {
  DEMO_WORKSPACE_A_LIVE_IDS,
  DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID,
  openDemoWorkspaceReviewDetailShellReady,
} from "./helpers/demo-workspace-live-scope";
import { ensureDemoWorkspaceSeedReady } from "./helpers/ensure-demo-workspace-seed";
import { liveApiBase, waitForAuthorityBuyerSummaryGoldenManifest } from "./helpers/live-api-client";
import {
  expectFinalizedManifestLinkVisible,
  expectLiveManifestDetailPageReady,
  openVisibleReviewOutcomeSummaryStrip,
  outcomeStripSignedRecordLink,
} from "./helpers/operator-journey";

const productTourRunId = DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID;

test.describe("live-api-review-manifest-roundtrip", { tag: ["@founder"] }, () => {
  test.beforeAll(async ({ request }) => {
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + DevelopmentBypass.`,
      );
    }

    await ensureDemoWorkspaceSeedReady(request);
  });

  test("canonical showcase: outcome finalized link → manifest → breadcrumb back to review", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    await waitForAuthorityBuyerSummaryGoldenManifest(
      request,
      productTourRunId,
      90_000,
      DEMO_WORKSPACE_A_LIVE_IDS,
    );
    await openDemoWorkspaceReviewDetailShellReady(page, DEMO_WORKSPACE_A_LIVE_IDS, productTourRunId);
    await expect(getAppMain(page)).not.toContainText(/Something went wrong/i);

    const outcomeStrip = await openVisibleReviewOutcomeSummaryStrip(page, productTourRunId);

    const manifestLink = outcomeStripSignedRecordLink(outcomeStrip);

    await expect(manifestLink).toBeVisible({ timeout: 60_000 });
    await expect(manifestLink).toContainText(/Finalized/i);

    // Capture href before navigation — after click the outcome strip is gone from the DOM.
    const manifestHref = (await manifestLink.getAttribute("href")) ?? "";
    const manifestIdMatch = manifestHref.match(/\/(?:signed-records|manifests)\/([^/?#]+)/i);
    const manifestId = manifestIdMatch?.[1] ?? "";

    expect(manifestId.length).toBeGreaterThan(0);

    await Promise.all([
      page.waitForURL(/\/(?:signed-records|manifests)\/.+/i, { waitUntil: "commit" }),
      manifestLink.click(),
    ]);

    await expectLiveManifestDetailPageReady(page, manifestId, { timeoutMs: 120_000 });

    await expect(page.getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN })).toBeVisible({
      timeout: 60_000,
    });

    const reviewLink = page.getByTestId("manifest-detail-back-to-review");

    await expect(reviewLink).toBeVisible({ timeout: 30_000 });

    await Promise.all([
      page.waitForURL(/\/reviews\/.+/i, { waitUntil: "commit" }),
      reviewLink.click(),
    ]);

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible({ timeout: 60_000 });
    await expectFinalizedManifestLinkVisible(page, { runId: productTourRunId, timeoutMs: 60_000 });
  });
});
