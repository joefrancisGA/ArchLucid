import { expect, type Page } from "@playwright/test";

import { backendApiPath } from "./route-match";
import { getAppMain } from "./app-main";
import { expectNoGenericErrorBoundary } from "./buyer-golden-path";
import { expectAnyLocatorVisible } from "./locator-readiness";

const liveProxyOkStatuses = [200, 201] as const;

function matchesLiveProxyArchitectureRunsList(url: URL): boolean {
  const path = backendApiPath(url);

  return path === "/v1/architecture/runs";
}

function matchesLiveProxyAuthorityRunDetail(url: URL, runId: string): boolean {
  const path = backendApiPath(url);

  return (
    path === `/v1/authority/runs/${encodeURIComponent(runId)}`
    || path === `/v1/authority/runs/${encodeURIComponent(runId)}/buyer-summary`
  );
}

function matchesLiveProxyManifestSummary(url: URL, manifestId: string): boolean {
  const path = backendApiPath(url);
  const encoded = encodeURIComponent(manifestId);

  return (
    path === `/v1/authority/signed-records/${encoded}/summary`
    || path === `/v1/authority/manifests/${encoded}/summary`
  );
}

async function isLiveAuthorityRunDetailSurfaceVisible(page: Page): Promise<boolean> {
  const main = getAppMain(page);

  return (
    (await page.locator('[data-buyer-golden-ready="true"]').isVisible().catch(() => false))
    || (await main.getByTestId("review-detail-workspace").isVisible().catch(() => false))
    || (await main.getByTestId("cto-demo-executive-above-fold").isVisible().catch(() => false))
    || (await main.getByText("Executive summary", { exact: true }).isVisible().catch(() => false))
  );
}

/** Waits for operator shell hydration without treating optional trial-status 404 as failure. */
export async function waitForLiveOperatorPageHydration(page: Page, options?: { timeoutMs?: number }): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 60_000;

  await expectNoGenericErrorBoundary(page);
  await page.waitForLoadState("networkidle", { timeout: timeoutMs });
}

/** Waits for scoped architecture run list hydration through the UI proxy. */
export async function waitForLiveArchitectureRunsListResponse(
  page: Page,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 60_000;

  await page.waitForResponse(
    (response) =>
      matchesLiveProxyArchitectureRunsList(new URL(response.url()))
      && liveProxyOkStatuses.includes(response.status() as (typeof liveProxyOkStatuses)[number]),
    { timeout: timeoutMs },
  );
}

/** Waits for run detail / buyer-summary hydration for a known run id. */
export async function waitForLiveAuthorityRunDetailResponse(
  page: Page,
  runId: string,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 90_000;

  if (await isLiveAuthorityRunDetailSurfaceVisible(page)) {
    return;
  }

  try {
    await page.waitForResponse(
      (response) =>
        matchesLiveProxyAuthorityRunDetail(new URL(response.url()), runId)
        && liveProxyOkStatuses.includes(response.status() as (typeof liveProxyOkStatuses)[number]),
      { timeout: 8_000 },
    );
  } catch {
    // RSC loads buyer-summary server-side; proxy listeners often miss the fetch.
    await waitForLiveAuthorityRunDetailHydration(page, runId, { timeoutMs });
  }
}

/**
 * Polls until run detail buyer surface is hydrated — tolerates SSR completing before proxy listeners attach.
 */
export async function waitForLiveAuthorityRunDetailHydration(
  page: Page,
  runId: string,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const main = getAppMain(page);

  await expectNoGenericErrorBoundary(page);

  await expect(async () => {
    await expect(main.getByTestId("branded-not-found")).toHaveCount(0, { timeout: 3_000 });
    await expect(main.getByTestId("run-detail-load-failure")).toHaveCount(0, { timeout: 3_000 });

    if (!(await isLiveAuthorityRunDetailSurfaceVisible(page))) {
      await page
        .waitForResponse(
          (response) =>
            matchesLiveProxyAuthorityRunDetail(new URL(response.url()), runId)
            && liveProxyOkStatuses.includes(response.status() as (typeof liveProxyOkStatuses)[number]),
          { timeout: 8_000 },
        )
        .catch(() => {
          // SSR may have hydrated before the listener attached.
        });
    }

    await expectAnyLocatorVisible(
      [
        page.locator('[data-buyer-golden-ready="true"]'),
        main.getByTestId("review-detail-workspace"),
        main.getByTestId("cto-demo-executive-above-fold"),
        main.getByText("Executive summary", { exact: true }),
      ],
      8_000,
    );
  }).toPass({ timeout: timeoutMs });
}

/** Waits for manifest summary hydration on canonical signed-records routes. */
export async function waitForLiveManifestSummaryResponse(
  page: Page,
  manifestId: string,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const manifestMain = getAppMain(page);

  if (await manifestMain.locator("#manifest-overview").isVisible().catch(() => false)) {
    return;
  }

  try {
    await page.waitForResponse(
      (response) =>
        matchesLiveProxyManifestSummary(new URL(response.url()), manifestId)
        && liveProxyOkStatuses.includes(response.status() as (typeof liveProxyOkStatuses)[number]),
      { timeout: 8_000 },
    );
  } catch {
    // RSC loads manifest summary server-side; proxy listeners often miss the fetch.
    await waitForLiveManifestDetailHydration(page, manifestId, { timeoutMs });
  }
}

/**
 * Polls until manifest detail content is hydrated — tolerates SSR completing before the response listener attaches.
 */
export async function waitForLiveManifestDetailHydration(
  page: Page,
  manifestId: string,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const manifestMain = getAppMain(page);

  await expectNoGenericErrorBoundary(page);

  await expect(async () => {
    await expect(manifestMain.getByTestId("branded-not-found")).toHaveCount(0, { timeout: 3_000 });
    await expect(manifestMain.getByTestId("manifest-detail-loading-shell")).toHaveCount(0, { timeout: 3_000 });
    await expect(manifestMain.getByText(/Loading review record/i)).toHaveCount(0, { timeout: 3_000 });
    await expect(manifestMain.getByText(/Fetching manifest summary/i)).toHaveCount(0, { timeout: 3_000 });

    const overviewVisible = await manifestMain.locator("#manifest-overview").isVisible();

    if (!overviewVisible) {
      await page
        .waitForResponse(
          (response) =>
            matchesLiveProxyManifestSummary(new URL(response.url()), manifestId)
            && liveProxyOkStatuses.includes(response.status() as (typeof liveProxyOkStatuses)[number]),
          { timeout: 8_000 },
        )
        .catch(() => {
          // SSR may have hydrated before the listener attached.
        });
    }

    await expect(manifestMain.locator("#manifest-overview")).toBeVisible({ timeout: 8_000 });
  }).toPass({ timeout: timeoutMs });
}

/** Reviews hub list surface: page ready, list API completed, no generic error shell. */
export async function expectLiveReviewsHubListReady(page: Page, options?: { timeoutMs?: number }): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const main = getAppMain(page);

  await expect(main).toBeVisible({ timeout: timeoutMs });
  await waitForLiveOperatorPageHydration(page, { timeoutMs });
  await waitForLiveArchitectureRunsListResponse(page, { timeoutMs });
  await expectNoGenericErrorBoundary(page);
}
