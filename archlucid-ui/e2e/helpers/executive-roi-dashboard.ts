import { expect, type Page, type Response } from "@playwright/test";

import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";

import {
  EXECUTIVE_ROI_DEDUP_SCENARIO,
  getExecutiveRoiExportMockJson,
} from "../fixtures/executive-roi-dashboard-mock";

export const EXECUTIVE_ROI_DASHBOARD_PATHS = {
  operator: "/dashboard",
  executive: "/executive/dashboard",
} as const;

type ExecutiveRoiExportPayload = {
  rows?: Array<{ findingId?: string; estimatedUsdSavings?: number; environment?: string }>;
  savingsByEnvironment?: Array<{ environment?: string; estimatedUsdSavings?: number }>;
};

function isSuccessfulProxyResponse(candidate: Response): boolean {
  const status = candidate.status();

  return status >= 200 && status < 400;
}

function isExecutiveRoiSummaryProxyResponse(candidate: Response): boolean {
  const url = candidate.url();

  return (
    url.includes("/v1/roi/executive-summary") &&
    !url.includes("/export") &&
    !url.includes("/history") &&
    !url.includes("/board-pack") &&
    candidate.request().method() === "GET" &&
    isSuccessfulProxyResponse(candidate)
  );
}

function isExecutiveRoiExportProxyResponse(candidate: Response): boolean {
  return (
    candidate.url().includes("/v1/roi/executive-summary/export") &&
    isSuccessfulProxyResponse(candidate)
  );
}

async function expandExecutiveSupportingMetricsIfPresent(page: Page): Promise<void> {
  const supportingMetrics = page.getByTestId("executive-dashboard-supporting-metrics");

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

export async function expectNoExecutiveRoiDashboardErrorBoundary(page: Page): Promise<void> {
  await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
}

export async function expectExecutiveRoiDashboardShell(page: Page): Promise<void> {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  await expect(
    page
      .getByTestId("executive-summary-heading")
      .or(page.getByRole("heading", { level: 2, name: v.pageTitle }))
      .or(page.getByRole("heading", { level: 2, name: v.portfolioPageTitle }))
      .or(page.getByRole("heading", { name: /executive summary|portfolio overview/i })),
  ).toBeVisible();
  await expect(page.getByText(v.pageLead).or(page.getByText(v.portfolioPageLead))).toBeVisible();
}

/** Register summary + export proxy listeners before navigation to avoid hydration races. */
export function prepareExecutiveRoiDashboardProxyWaits(page: Page): {
  readonly summaryResponse: Promise<Response>;
  readonly exportPayload: Promise<ExecutiveRoiExportPayload>;
} {
  const summaryResponse = page.waitForResponse(isExecutiveRoiSummaryProxyResponse, { timeout: 90_000 });
  // Operator legacy `/dashboard` fires export on mount; portfolio `/executive/dashboard` defers until summary hydrates.
  const earlyExportResponse = page.waitForResponse(isExecutiveRoiExportProxyResponse, { timeout: 90_000 });
  const exportPayload = summaryResponse.then(async () => {
    await page
      .getByText("Savings by environment")
      .scrollIntoViewIfNeeded({ timeout: 30_000 })
      .catch(() => undefined);
    await expect(page.getByText("Savings by environment")).toBeVisible({ timeout: 30_000 }).catch(() => undefined);

    const lateExportResponse = page.waitForResponse(isExecutiveRoiExportProxyResponse, { timeout: 90_000 });
    const response = await Promise.race([earlyExportResponse, lateExportResponse]);

    return (await response.json()) as ExecutiveRoiExportPayload;
  });

  return { summaryResponse, exportPayload };
}

/** Call before `page.goto` so summary/export proxy responses are not missed during hydration. */
export async function waitForExecutiveRoiExportResponse(page: Page): Promise<ExecutiveRoiExportPayload> {
  const { summaryResponse, exportPayload } = prepareExecutiveRoiDashboardProxyWaits(page);

  await summaryResponse;

  await expect(page.getByTestId("executive-primary-decisions-needed"))
    .toBeVisible({ timeout: 30_000 })
    .catch(() => undefined);

  await page.getByText("Savings by environment").scrollIntoViewIfNeeded({ timeout: 30_000 }).catch(() => undefined);
  await expect(page.getByText("Savings by environment")).toBeVisible({ timeout: 30_000 }).catch(() => undefined);

  try {
    return await exportPayload;
  } catch {
    await page.getByText("Savings by environment").scrollIntoViewIfNeeded({ timeout: 15_000 }).catch(() => undefined);

    const response = await page.waitForResponse(isExecutiveRoiExportProxyResponse, { timeout: 15_000 });

    return (await response.json()) as ExecutiveRoiExportPayload;
  }
}

export function expectedExecutiveRoiExportPayload(): ExecutiveRoiExportPayload {
  return getExecutiveRoiExportMockJson() as ExecutiveRoiExportPayload;
}

/** Assert export contract and UI both reflect unique-identity dedupe across runs. */
export async function expectExecutiveRoiFindingDeduplication(
  page: Page,
  exportPayload?: ExecutiveRoiExportPayload,
): Promise<void> {
  const resolvedExportPayload = exportPayload ?? (await waitForExecutiveRoiExportResponse(page));
  const expected = expectedExecutiveRoiExportPayload();

  expect(resolvedExportPayload.rows?.length).toBe(expected.rows?.length);
  expect(resolvedExportPayload.rows?.length).toBe(1);
  expect(resolvedExportPayload.rows?.[0]?.findingId).toBe(EXECUTIVE_ROI_DEDUP_SCENARIO.sharedFindingId);

  const productionSlice = resolvedExportPayload.savingsByEnvironment?.find(
    (slice) => slice.environment === "production",
  );

  expect(productionSlice?.estimatedUsdSavings).toBe(
    EXECUTIVE_ROI_DEDUP_SCENARIO.deduplicatedProductionSavingsUsd,
  );
  expect(productionSlice?.estimatedUsdSavings).not.toBe(EXECUTIVE_ROI_DEDUP_SCENARIO.rawProductionSavingsUsd);

  await expect(page.getByTestId("exec-roi-environment-pie")).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByTestId("exec-roi-environment-pie").getByText("production", { exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("exec-roi-environment-pie").getByText("$100")).toBeVisible();

  await expect(page.getByText("Top systemic issues")).toBeVisible();
  await expect(
    page.getByText(
      `CostOptimization · Warning · ${EXECUTIVE_ROI_DEDUP_SCENARIO.deduplicatedSystemicIssueCount}`,
    ),
  ).toBeVisible();
}

export async function expectExecutiveRoiPortfolioPanels(page: Page): Promise<void> {
  await expect(page.getByTestId("exec-roi-identified-vs-realized-panel")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("exec-roi-identified-pending-usd")).toHaveText("$120,000");
  await expect(page.getByTestId("exec-roi-realized-usd")).toHaveText("$25,000");

  await expandExecutiveSupportingMetricsIfPresent(page);

  await expect(page.getByTestId("exec-kpi-resolved-30d")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("exec-roi-trend-chart")).toBeVisible({ timeout: 30_000 });
}

export async function expectExecutiveRoiExecutiveSurface(page: Page): Promise<void> {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  await expect(page.getByTestId("executive-dashboard-empty-state")).toHaveCount(0);
  await expect(page.getByTestId("executive-primary-decisions-needed")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("executive-value-narrative")).toBeVisible({ timeout: 30_000 });
  await expect(
    page
      .getByTestId("executive-exports-heading")
      .or(page.getByRole("heading", { name: /executive exports|sponsor exports/i }))
      .or(page.getByText(v.executiveExportsTitle)),
  ).toBeVisible({ timeout: 30_000 });
}
