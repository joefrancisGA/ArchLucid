import { expect, type Page } from "@playwright/test";

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
 * Graph uses `next/dynamic`; wait for the chunk placeholder to unmount before asserting copy.
 */
async function waitForGraphChunkIfNeeded(page: Page, href: string): Promise<void> {
  if (href !== "/graph" && !href.startsWith("/graph?")) {
    return;
  }

  const loading = page.locator('[data-testid="graph-viewer-chunk-loading"]');

  if ((await loading.count()) === 0) {
    return;
  }

  await loading.waitFor({ state: "detached", timeout: 120_000 });
}

/**
 * Dynamic import shells may briefly render “Loading graph” before the viewer mounts.
 */
async function waitOutLoadingGraphIfPresent(page: Page): Promise<void> {
  const loadingGraph = page.getByText("Loading graph");

  if ((await loadingGraph.count()) === 0) {
    return;
  }

  await loadingGraph.first().waitFor({ state: "detached", timeout: 120_000 });
}

/**
 * Audit page briefly renders “Showing 0 events” until the client `useEffect` search resolves (initial state is an empty list).
 * Mock API returns demo rows — wait so the screenshot gate does not observe that transient summary line.
 */
async function waitForAuditSearchSummaryNonEmpty(page: Page, href: string): Promise<void> {
  const pathOnly = href.split("?", 1)[0];

  if (pathOnly !== "/audit") {
    return;
  }

  const summary = page.locator('section[aria-labelledby="audit-results-heading"] p[role="status"]');

  await expect(summary).toContainText(/Showing [1-9]/, { timeout: 120_000 });
}

export async function assertPageFreeOfScreenshotDemoFailures(page: Page, href: string): Promise<void> {
  await waitForGraphChunkIfNeeded(page, href);
  await waitOutLoadingGraphIfPresent(page);
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
