import { expect, type Page } from "@playwright/test";

import { backendApiPath, matchesAuthorityProjectRunsPagedGet } from "./route-match";
import { getAppMain } from "./app-main";
import { expectNoGenericErrorBoundary } from "./buyer-golden-path";
import { expectAnyLocatorVisible } from "./locator-readiness";
import { reviewsHubRecentPackagesSection } from "./reviews-hub";

const liveProxyOkStatuses = [200, 201] as const;

function matchesLiveProxyProjectRunsList(url: URL): boolean {
  const path = backendApiPath(url);

  if (path === null) {
    return false;
  }

  // Reviews hub SSR uses GET /v1/authority/projects/{projectId}/reviews (not /v1/architecture/runs).
  return /^\/v1\/authority\/projects\/[^/]+\/reviews$/.test(path);
}

function matchesLiveProxyAuthorityRunDetail(url: URL, runId: string): boolean {
  const path = backendApiPath(url);

  return (
    path === `/v1/authority/reviews/${encodeURIComponent(runId)}`
    || path === `/v1/authority/reviews/${encodeURIComponent(runId)}/buyer-summary`
  );
}

function matchesLiveProxyManifestSummary(url: URL, manifestId: string): boolean {
  const path = backendApiPath(url);
  const encoded = encodeURIComponent(manifestId);

  return (
    path === `/v1/authority/signed-review-records/${encoded}/summary`
    || path === `/v1/authority/signed-review-records/${encoded}/summary`
  );
}

async function isLiveAuthorityRunDetailSurfaceVisible(page: Page): Promise<boolean> {
  const main = getAppMain(page);

  return (
    (await page.locator('[data-buyer-golden-ready="true"]').isVisible().catch(() => false))
    || (await main.getByTestId("review-detail-workspace").isVisible().catch(() => false))
    || (await main.getByTestId("cto-demo-sponsor-above-fold").isVisible().catch(() => false))
    || (await main.getByText("Sponsor report", { exact: true }).isVisible().catch(() => false))
  );
}

/** Waits for operator shell hydration without treating optional trial-status 404 as failure. */
export async function waitForLiveOperatorPageHydration(page: Page, options?: { timeoutMs?: number }): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 60_000;

  await expectNoGenericErrorBoundary(page);
  // Live API pages keep proxy/poll traffic open — networkidle often never settles (CI #2865 shard 2).
  await page.waitForLoadState("domcontentloaded", { timeout: timeoutMs });
  const appReady = page.locator("[data-app-ready='true']");

  if ((await appReady.count()) > 0) {
    await appReady.first().waitFor({ state: "attached", timeout: timeoutMs });

    return;
  }

  await page.waitForLoadState("load", { timeout: timeoutMs }).catch(() => undefined);
}

async function isLiveReviewsHubListSurfaceVisible(page: Page): Promise<boolean> {
  const main = getAppMain(page);

  return (
    (await reviewsHubRecentPackagesSection(main).isVisible().catch(() => false))
    || (await main.getByTestId("reviews-hub-recent-empty").isVisible().catch(() => false))
    || (await main.getByTestId("reviews-hub-packages-table").isVisible().catch(() => false))
  );
}

/**
 * Waits for reviews-hub list hydration. The hub loads runs via RSC (`listRunsByProjectPaged`),
 * so browser `/api/proxy` listeners often miss the fetch — prefer the rendered inventory surface.
 */
export async function waitForLiveArchitectureRunsListResponse(
  page: Page,
  options?: { timeoutMs?: number; projectId?: string },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 60_000;

  if (await isLiveReviewsHubListSurfaceVisible(page)) {
    return;
  }

  try {
    await page.waitForResponse(
      (response) => {
        const url = new URL(response.url());
        const statusOk = liveProxyOkStatuses.includes(response.status() as (typeof liveProxyOkStatuses)[number]);

        if (!statusOk) {
          return false;
        }

        if (options?.projectId !== undefined && options.projectId.trim().length > 0) {
          return matchesAuthorityProjectRunsPagedGet(url, options.projectId);
        }

        return matchesLiveProxyProjectRunsList(url);
      },
      { timeout: 8_000 },
    );
  } catch {
    // SSR may have hydrated before the listener attached.
  }

  await expect(async () => {
    expect(await isLiveReviewsHubListSurfaceVisible(page)).toBe(true);
  }).toPass({ timeout: timeoutMs });
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
        main.getByTestId("cto-demo-sponsor-above-fold"),
        main.getByText("Sponsor report", { exact: true }),
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

/** Reviews hub list surface: page ready, inventory hydrated, no generic error shell. */
export async function expectLiveReviewsHubListReady(
  page: Page,
  options?: { timeoutMs?: number; projectId?: string },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 90_000;
  const main = getAppMain(page);

  await expect(main).toBeVisible({ timeout: timeoutMs });
  await waitForLiveOperatorPageHydration(page, { timeoutMs });
  await waitForLiveArchitectureRunsListResponse(page, {
    timeoutMs,
    projectId: options?.projectId,
  });
  await expectNoGenericErrorBoundary(page);
}
