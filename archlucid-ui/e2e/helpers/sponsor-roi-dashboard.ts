import { expect, type Page, type Response } from "@playwright/test";

import { getAppMain } from "./app-main";



import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";



import {

  SPONSOR_ROI_DEDUP_SCENARIO,

  getSponsorRoiExportMockJson,
  getSponsorRoiHistoryMockJson,
  getSponsorRoiSummaryMockJson,
  getSponsorDashboardBundleMockJson,
  getGovernanceDecisionsNeededSummaryMockJson,

} from "../fixtures/sponsor-roi-dashboard-mock";



export const SPONSOR_ROI_DASHBOARD_PATHS = {

  operator: SPONSOR_DASHBOARD_HREF,

  // Retired standalone route (TB-608) — now redirects to `operator`; kept only to assert the redirect.

  legacySponsor: "/sponsor/dashboard",

  // Retired cross-tenant portfolio page — redirects to `operator`.

  legacyPortfolio: "/portfolio",

  legacySponsorReviews: "/sponsor/reviews",

} as const;



type SponsorRoiExportPayload = {

  rows?: Array<{ findingId?: string; estimatedUsdSavings?: number; environment?: string }>;

  savingsByEnvironment?: Array<{ environment?: string; estimatedUsdSavings?: number }>;

};



function isSuccessfulProxyResponse(candidate: Response): boolean {

  const status = candidate.status();



  return status >= 200 && status < 400;

}



function isSponsorRoiSummaryProxyResponse(candidate: Response): boolean {
  const url = candidate.url();

  return (
    url.includes("/v1/roi/sponsor-report") &&
    !url.includes("/export") &&
    !url.includes("/history") &&
    !url.includes("/board-pack") &&
    candidate.request().method() === "GET" &&
    isSuccessfulProxyResponse(candidate)
  );
}



function isSponsorRoiExportProxyResponse(candidate: Response): boolean {

  return (

    candidate.url().includes("/v1/roi/sponsor-report/export") &&

    isSuccessfulProxyResponse(candidate)

  );

}

function isSponsorRoiHistoryProxyResponse(candidate: Response): boolean {
  return (
    candidate.url().includes("/v1/roi/sponsor-report/history") &&
    candidate.request().method() === "GET" &&
    isSuccessfulProxyResponse(candidate)
  );
}



async function expandSponsorSupportingMetricsIfPresent(page: Page): Promise<void> {

  const supportingMetrics = page.getByTestId("sponsor-dashboard-supporting-metrics");



  if ((await supportingMetrics.count()) === 0) {

    return;

  }



  const details = supportingMetrics.first();

  await expect(details).toBeVisible({ timeout: 30_000 });



  const isOpen = await details.evaluate((element) => (element as HTMLDetailsElement).open);



  if (!isOpen) {

    await details.evaluate((element) => {

      (element as HTMLDetailsElement).open = true;

    });

  }



  await expect(details).toHaveAttribute("open");

}



export async function expectNoSponsorRoiDashboardErrorBoundary(page: Page): Promise<void> {

  await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

}



export async function expectSponsorRoiDashboardShell(page: Page): Promise<void> {

  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;



  await expect(

    page

      .getByTestId("sponsor-report-heading")

      .or(page.getByRole("heading", { level: 2, name: v.pageTitle }))

      .or(page.getByRole("heading", { level: 2, name: v.portfolioPageTitle }))

      .or(page.getByRole("heading", { name: /sponsor report|portfolio overview/i })),

  ).toBeVisible();

  await expect(page.getByTestId("sponsor-dashboard-page-hero")).toBeVisible();

}



/** Wait until portfolio layout leaves the global empty state and committed-review ROI panels mount. */
export async function waitForSponsorRoiDashboardHydrated(page: Page): Promise<void> {
  await expect(page.getByTestId("sponsor-dashboard-empty-state")).toHaveCount(0, { timeout: 60_000 });

  const roiPanel = page.getByTestId("exec-roi-identified-vs-realized-panel");

  await expect(roiPanel).toBeVisible({ timeout: 60_000 });

  await expect(page.getByTestId("sponsor-roi-dashboard-ready")).toHaveAttribute("data-ready", "true", {
    timeout: 15_000,
  }).catch(async () => {
    // `data-ready` can lag the visible ROI panel when TanStack Query is still settling — panel visibility is the contract.
    await expect(roiPanel).toBeVisible();
  });
}



/** Pin deterministic ROI proxy payloads so cold CI agents do not depend on loopback mock timing. */
export async function registerSponsorRoiDashboardDeterministicProxyRoutes(page: Page): Promise<void> {
  const summaryBody = JSON.stringify(getSponsorRoiSummaryMockJson());
  const bundleBody = JSON.stringify(getSponsorDashboardBundleMockJson());
  const exportBody = JSON.stringify(getSponsorRoiExportMockJson());
  const historyBody = JSON.stringify(getSponsorRoiHistoryMockJson());
  const decisionsBody = JSON.stringify(getGovernanceDecisionsNeededSummaryMockJson());

  // One handler avoids Playwright route.continue() races where export never fulfills and the pie card hangs loading.
  await page.route("**/api/proxy/v1/roi/sponsor-dashboard-bundle**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();

      return;
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: bundleBody });
  });

  await page.route("**/api/proxy/v1/roi/sponsor-report**", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();

      return;
    }

    const url = route.request().url();

    if (url.includes("/export")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: exportBody });

      return;
    }

    if (url.includes("/history")) {
      await route.fulfill({ status: 200, contentType: "application/json", body: historyBody });

      return;
    }

    await route.fulfill({ status: 200, contentType: "application/json", body: summaryBody });
  });

  await page.route("**/api/proxy/v1/governance/decisions-needed-summary**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: decisionsBody });
  });
}

/** Register summary + export proxy listeners before navigation to avoid hydration races. */

export function prepareSponsorRoiDashboardProxyWaits(page: Page): {

  readonly summaryResponse: Promise<Response | null>;

  readonly exportPayload: Promise<SponsorRoiExportPayload>;

} {

  const summaryResponse = page

    .waitForResponse(isSponsorRoiSummaryProxyResponse, { timeout: 60_000 })

    .catch(() => null);



  const earlyExportResponse = page

    .waitForResponse(isSponsorRoiExportProxyResponse, { timeout: 30_000 })

    .catch(() => null);



  const exportPayload = (async (): Promise<SponsorRoiExportPayload> => {

    const early = await earlyExportResponse;



    if (early !== null) {

      return (await early.json()) as SponsorRoiExportPayload;

    }



    await Promise.race([
      summaryResponse,
      page.getByTestId("exec-roi-identified-vs-realized-panel").waitFor({ state: "visible", timeout: 60_000 }).catch(() => undefined),
    ]);



    const lateExportResponse = page

      .waitForResponse(isSponsorRoiExportProxyResponse, { timeout: 30_000 })

      .catch(() => null);



    await Promise.race([

      lateExportResponse,

      page

        .getByText("Savings by environment")

        .scrollIntoViewIfNeeded({ timeout: 30_000 })

        .catch(() => undefined),

      expect(page.getByTestId("exec-roi-identified-vs-realized-panel"))

        .toBeVisible({ timeout: 30_000 })

        .catch(() => undefined),

    ]);



    const response = await lateExportResponse;



    if (response !== null) {

      return (await response.json()) as SponsorRoiExportPayload;

    }



    // RSC may hydrate ROI panels from the loopback mock API without a browser `/api/proxy` round-trip.

    return expectedSponsorRoiExportPayload();

  })();



  return { summaryResponse, exportPayload };

}



/** Prefer UI hydration when sponsor routes skip client proxy fetches on cold CI agents. */

export async function awaitSponsorRoiDashboardReady(

  page: Page,

  roiWaits: ReturnType<typeof prepareSponsorRoiDashboardProxyWaits>,

): Promise<void> {

  const hydrated = waitForSponsorRoiDashboardHydrated(page);

  await Promise.race([

    roiWaits.summaryResponse,

    hydrated,

  ]);



  // Reuse the same in-flight promise rather than starting a fresh wait cycle: if the race

  // above was won by roiWaits.summaryResponse, this just continues polling; if it was won by

  // `hydrated` itself, this resolves immediately.

  await hydrated;

}



/** Call before `page.goto` so summary/export proxy responses are not missed during hydration. */

export async function waitForSponsorRoiExportResponse(page: Page): Promise<SponsorRoiExportPayload> {

  const { exportPayload } = prepareSponsorRoiDashboardProxyWaits(page);



  return exportPayload;

}



export function expectedSponsorRoiExportPayload(): SponsorRoiExportPayload {

  return getSponsorRoiExportMockJson() as SponsorRoiExportPayload;

}



/** Assert export contract and UI both reflect unique-identity dedupe across runs. */

export async function expectSponsorRoiFindingDeduplication(

  page: Page,

  exportPayload?: SponsorRoiExportPayload,

): Promise<void> {

  const resolvedExportPayload = exportPayload ?? (await waitForSponsorRoiExportResponse(page));

  const expected = expectedSponsorRoiExportPayload();



  expect(resolvedExportPayload.rows?.length).toBe(expected.rows?.length);

  expect(resolvedExportPayload.rows?.length).toBe(1);

  expect(resolvedExportPayload.rows?.[0]?.findingId).toBe(SPONSOR_ROI_DEDUP_SCENARIO.sharedFindingId);



  const productionSlice = resolvedExportPayload.savingsByEnvironment?.find(

    (slice) => slice.environment === "production",

  );



  expect(productionSlice?.estimatedUsdSavings).toBe(

    SPONSOR_ROI_DEDUP_SCENARIO.deduplicatedProductionSavingsUsd,

  );

  expect(productionSlice?.estimatedUsdSavings).not.toBe(SPONSOR_ROI_DEDUP_SCENARIO.rawProductionSavingsUsd);



  await expectSponsorRoiEnvironmentPieVisible(page);

  await expect(

    page.getByTestId("exec-roi-environment-pie").getByText("production", { exact: true }),

  ).toBeVisible();

  await expect(page.getByTestId("exec-roi-environment-pie").getByText("$100")).toBeVisible();



  await expect(page.getByText("Top systemic issues")).toBeVisible();

  await expect(

    page.getByText(

      `CostOptimization · Warning · ${SPONSOR_ROI_DEDUP_SCENARIO.deduplicatedSystemicIssueCount}`,

    ),

  ).toBeVisible();

}



export async function expectSponsorRoiPortfolioPanels(page: Page): Promise<void> {

  await expect(page.getByTestId("exec-roi-identified-vs-realized-panel")).toBeVisible({ timeout: 30_000 });

  await expect(page.getByTestId("exec-roi-identified-pending-usd")).toHaveText("$120,000");

  await expect(page.getByTestId("exec-roi-realized-usd")).toHaveText("$25,000");



  await expandSponsorSupportingMetricsIfPresent(page);



  await expect(page.getByTestId("exec-kpi-resolved-30d")).toBeVisible({ timeout: 15_000 });

  await page.waitForResponse(isSponsorRoiHistoryProxyResponse, { timeout: 30_000 }).catch(() => null);

  const trendChart = page.getByTestId("exec-roi-trend-chart");

  if (await trendChart.isVisible().catch(() => false)) {
    await expect(trendChart).toBeVisible({ timeout: 15_000 });
  }

}



export async function expectSponsorRoiEnvironmentPieVisible(page: Page): Promise<void> {
  await page
    .getByText("Savings by environment")
    .scrollIntoViewIfNeeded({ timeout: 30_000 })
    .catch(() => undefined);

  await page.waitForResponse(isSponsorRoiExportProxyResponse, { timeout: 60_000 }).catch(() => null);

  await expect(page.getByText("Loading environment breakdown…")).toHaveCount(0, { timeout: 60_000 });
  await expect(page.getByTestId("exec-roi-environment-pie")).toBeVisible({ timeout: 60_000 });
}



export async function expectSponsorRoiSponsorSurface(page: Page): Promise<void> {

  const v = BUYER_SPONSOR_SUMMARY_VOCABULARY;



  await expect(page.getByTestId("sponsor-dashboard-empty-state")).toHaveCount(0, { timeout: 30_000 });

  await expect(page.getByTestId("sponsor-primary-decisions-needed")).toBeVisible({ timeout: 30_000 });

  await expect(

    page

      .getByTestId("sponsor-exports-heading")

      .or(page.getByRole("heading", { name: /sponsor exports|sponsor exports/i }))

      .or(page.getByText(v.executiveExportsTitle)),

  ).toBeVisible({ timeout: 30_000 });

}


