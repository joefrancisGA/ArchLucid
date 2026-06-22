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

export async function expectNoExecutiveRoiDashboardErrorBoundary(page: Page): Promise<void> {
  await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
}

export async function expectExecutiveRoiDashboardShell(page: Page): Promise<void> {
  const v = BUYER_EXECUTIVE_SUMMARY_VOCABULARY;

  await expect(
    page
      .getByTestId("executive-summary-heading")
      .or(page.getByRole("heading", { level: 2, name: v.pageTitle }))
      .or(page.getByRole("heading", { name: /executive summary/i })),
  ).toBeVisible();
  await expect(page.getByText(v.pageLead)).toBeVisible();
}

export async function waitForExecutiveRoiExportResponse(page: Page): Promise<ExecutiveRoiExportPayload> {
  const response = await page.waitForResponse(
    (candidate: Response) =>
      candidate.url().includes("/api/proxy/v1/roi/executive-summary/export") && candidate.ok(),
    { timeout: 60_000 },
  );

  return (await response.json()) as ExecutiveRoiExportPayload;
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
  await expect(page.getByTestId("exec-kpi-resolved-30d")).toBeVisible();
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
