import { expect, type Page } from "@playwright/test";

import { backendApiPath } from "./route-match";
import { getAppMain } from "./app-main";
import { expectNoGenericErrorBoundary } from "./buyer-golden-path";

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

  return path === `/v1/authority/signed-records/${encodeURIComponent(manifestId)}/summary`;
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
  const timeoutMs = options?.timeoutMs ?? 60_000;

  await page.waitForResponse(
    (response) =>
      matchesLiveProxyAuthorityRunDetail(new URL(response.url()), runId)
      && liveProxyOkStatuses.includes(response.status() as (typeof liveProxyOkStatuses)[number]),
    { timeout: timeoutMs },
  );
}

/** Waits for manifest summary hydration on canonical signed-records routes. */
export async function waitForLiveManifestSummaryResponse(
  page: Page,
  manifestId: string,
  options?: { timeoutMs?: number },
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 60_000;

  await page.waitForResponse(
    (response) =>
      matchesLiveProxyManifestSummary(new URL(response.url()), manifestId)
      && liveProxyOkStatuses.includes(response.status() as (typeof liveProxyOkStatuses)[number]),
    { timeout: timeoutMs },
  );
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
