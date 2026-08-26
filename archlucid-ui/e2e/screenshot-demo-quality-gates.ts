import { expect, type Page, type Response } from "@playwright/test";

/**
 * Fail the full-route screenshot crawl when evergreen demo pages still show empty states or internal placeholders.
 * Keep messages grep-friendly for CI logs.
 */
const SCREENSHOT_FORBIDDEN_TEXT_FRAGMENTS: readonly string[] = [
  "not wired in this build",
  "Loading workflow data.",
  "Showing 0 events",
];

const REGISTERED_PACKS_EMPTY_KPI_REGEX = /Registered packs\r?\n0\r?\nVisible in this workspace/;

/**
 * Graph uses `next/dynamic` (chunk placeholder) and `GraphFetchStatusAlerts` / Suspense copy that includes
 * “Loading graph”. A one-shot `count() === 0` check races: those nodes often appear after the first query,
 * so we poll until both the chunk shell is gone and the body no longer carries that copy.
 */
async function waitForGraphScreenshotSettled(page: Page, href: string): Promise<void> {
  if (href !== "/insights/evidence-graph" && !href.startsWith("/graph?")) {
    return;
  }

  await expect
    .poll(
      async () => {
        const chunkLoadingCount = await page.locator('[data-testid="graph-viewer-chunk-loading"]').count();
        const bodyText = await page.locator("body").innerText();

        return chunkLoadingCount === 0 && !bodyText.includes("Loading graph");
      },
      { timeout: 120_000 },
    )
    .toBe(true);
}

function isAuditSearchProxyResponse(candidate: Response): boolean {
  const url = candidate.url();

  return (
    url.includes("/v1/audit/search") &&
    candidate.request().method() === "GET" &&
    candidate.ok()
  );
}

async function auditScreenshotHasPopulatedResults(page: Page): Promise<boolean> {
  if (await auditScreenshotSummaryShowsRows(page)) {
    return true;
  }

  if (await auditScreenshotTimelineHasRows(page)) {
    return true;
  }

  if ((await page.getByTestId("audit-buyer-sample-timeline-chip").count()) > 0) {
    await page.getByTestId("audit-buyer-sample-timeline-chip").scrollIntoViewIfNeeded().catch(() => undefined);

    if (await auditScreenshotTimelineHasRows(page)) {
      return true;
    }

    if (await auditScreenshotSummaryShowsRows(page)) {
      return true;
    }
  }

  return false;
}

async function auditScreenshotTimelineHasRows(page: Page): Promise<boolean> {
  return (await page.getByTestId("audit-timeline-event-card").count()) > 0;
}

async function auditScreenshotSummaryShowsRows(page: Page): Promise<boolean> {
  const summaryText = (await page.getByTestId("audit-search-summary").innerText()).trim();

  return /Showing [1-9]\d*/.test(summaryText);
}

/** Buyer-polished audit tucks Search inside a Radix collapsible — open via aria-expanded, not summary text alone. */
async function expandAuditBuyerFiltersIfPresent(page: Page): Promise<void> {
  const optionalFilters = page.getByRole("button", {
    name: /Optional filters — event type, review scope, and search actions/i,
  });

  if ((await optionalFilters.count()) === 0) {
    return;
  }

  const trigger = optionalFilters.first();
  await trigger.scrollIntoViewIfNeeded().catch(() => undefined);

  if ((await trigger.getAttribute("aria-expanded")) !== "true") {
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true", { timeout: 10_000 });
  }
}

async function primeAuditSearchIfStillEmpty(page: Page): Promise<void> {
  await expandAuditBuyerFiltersIfPresent(page);

  const searchButton = page.getByRole("button", { name: /^(Search audit log|Search)$/i }).first();

  if ((await searchButton.count()) > 0) {
    await searchButton.click({ force: true });

    return;
  }

  const clearFilters = page.getByRole("button", { name: /^(Clear filters|Clear filters & search)$/i }).first();

  if ((await clearFilters.count()) > 0) {
    await clearFilters.click({ force: true });
  }
}

/**
 * Audit page briefly renders “Showing 0 events” until the client search resolves (initial state is an empty list).
 * Buyer-polished shells tuck Search inside a collapsed panel — expand and trigger search when auto-prime races.
 */
export async function waitForAuditSearchSummaryNonEmpty(page: Page, href: string): Promise<void> {
  const pathOnly = href.split("?", 1)[0];

  if (pathOnly !== "/governance/audit" && pathOnly !== "/audit") {
    return;
  }

  const summary = page.getByTestId("audit-search-summary");

  await expect(page.getByTestId("audit-page-title")).toBeVisible({ timeout: 60_000 });
  await expect(summary).toBeVisible({ timeout: 60_000 });

  void page.waitForResponse(isAuditSearchProxyResponse, { timeout: 90_000 }).catch(() => undefined);

  let primeAttempts = 0;

  await expect
    .poll(
      async () => {
        if (await auditScreenshotHasPopulatedResults(page)) {
          return true;
        }

        if (primeAttempts < 12) {
          primeAttempts += 1;

          const searchResponsePromise = page
            .waitForResponse(isAuditSearchProxyResponse, { timeout: 20_000 })
            .catch(() => null);

          await primeAuditSearchIfStillEmpty(page);
          await searchResponsePromise;
        }

        return false;
      },
      { timeout: 120_000, intervals: [500, 1_000, 2_000] },
    )
    .toBe(true);
}

/**
 * TB-730 sets `data-app-ready` on deferred access-gate chrome before route children mount.
 * Screenshot crawls must wait for the gate to clear, then for route anchors on flaky paths.
 */
export async function waitForScreenshotOperatorShellChildren(
  page: Page,
  _href: string,
  effectiveHref: string,
): Promise<void> {
  await expect(page.getByTestId("operator-shell-access-gate-loading")).toHaveCount(0, { timeout: 90_000 });

  const pathOnly = effectiveHref.split("?", 1)[0];
  const search = effectiveHref.includes("?") ? effectiveHref.split("?", 2)[1] ?? "" : "";
  const tabParam = new URLSearchParams(search).get("tab");

  if (
    pathOnly === "/advisory-scheduling"
    || pathOnly === "/advisory"
    || (pathOnly === "/governance/advisory-scans" && tabParam === "schedules")
    || pathOnly === "/governance/advisory-scans"
  ) {
    await expect(page.getByTestId("advisory-hub")).toBeVisible({ timeout: 60_000 });
  }

  if (pathOnly === "/internal/validate-route") {
    const validateReviewHeading = page.getByRole("heading", { name: /^Validate review$/i });

    if ((await validateReviewHeading.count()) > 0) {
      await expect(validateReviewHeading).toBeVisible({ timeout: 60_000 });
    }
    else {
      await expect(page.locator("h2").filter({ hasText: /^Validate review$/i })).toBeVisible({ timeout: 60_000 });
    }
  }
}

export async function assertPageFreeOfScreenshotDemoFailures(page: Page, href: string): Promise<void> {
  await waitForGraphScreenshotSettled(page, href);
  await waitForAuditSearchSummaryNonEmpty(page, href);

  const bodyText = await page.locator("body").innerText();

  for (const fragment of SCREENSHOT_FORBIDDEN_TEXT_FRAGMENTS) {
    if (bodyText.includes(fragment)) {
      throw new Error(`Screenshot demo gate (${href}): unexpected copy fragment "${fragment}"`);
    }
  }

  if (bodyText.includes("Loading graph")) {
    throw new Error(`Screenshot demo gate (${href}): graph still showing "Loading graph" after wait`);
  }

  if (REGISTERED_PACKS_EMPTY_KPI_REGEX.test(bodyText)) {
    throw new Error(
      `Screenshot demo gate (${href}): policy packs "Registered packs" KPI is zero (expect merged demo inventory)`,
    );
  }
}
