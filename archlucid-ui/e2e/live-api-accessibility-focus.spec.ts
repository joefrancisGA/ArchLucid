import { expect, test, type Page } from "@playwright/test";

import { OPERATOR_NAV_LINK_LABELS, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";

import { axeLiveE2eDisableRuleIdsNow } from "./axe-rule-allowlist";
import { runAxe } from "./helpers/axe-helper";

/**
 * Pilot group `<nav aria-label>` — always `group.label` from `PilotNavGroupBuilder` (`SidebarNav` sets `aria-label={group.label}`).
 */
const pilotNavGroupAriaLabel = "Architecture";

/** Canonical reviews list route — pilot sidebar + minimal-shell header both link here. */
const reviewsListNavHref = "/reviews?projectId=default";

/** Client-side App Router navigations do not emit `load`; `commit` matches soft route changes. */
const reviewsRouteUrlPattern = /\/reviews(?:\/|\?|$|#)/;

/** Session guard key — must match `TrialWelcomeRunDeepLink` so home stays on `/` until the test clicks Reviews. */
const trialWelcomeHomeRedirectSessionKey = "archlucid_trial_welcome_home_redirect_v1";

async function waitForOperatorShellReady(page: Page): Promise<void> {
  await page.locator('[data-app-ready="true"]').waitFor({ state: "attached", timeout: 60_000 });
  await expect(page.getByTestId("operator-shell-access-gate-loading")).toHaveCount(0, { timeout: 60_000 });
}

/**
 * `TrialWelcomeRunDeepLink` can race sidebar clicks on operator home. Mark the welcome redirect consumed once
 * trial-status resolves so client navigation tests start from `/` reliably.
 */
async function preventTrialWelcomeHomeAutoRedirect(page: Page): Promise<void> {
  await page.evaluate(async (sessionKey) => {
    try {
      const response = await fetch("/api/proxy/v1/tenant/trial-status", {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return;
      }

      const json = (await response.json()) as { trialWelcomeRunId?: string | null };
      const welcomeId = json.trialWelcomeRunId?.trim() ?? "";

      if (welcomeId.length > 0) {
        sessionStorage.setItem(sessionKey, welcomeId);
      }
    } catch {
      /* ignore */
    }
  }, trialWelcomeHomeRedirectSessionKey);
}

async function waitForReviewsRoute(page: Page): Promise<void> {
  await page.waitForURL(reviewsRouteUrlPattern, { timeout: 60_000, waitUntil: "commit" });
}

/** Waits until the desktop sidebar pilot nav cluster is visible (links are always expanded). */
async function ensureCorePilotSectionExpanded(page: Page): Promise<void> {
  const minimalRoot = page.getByTestId("app-shell-minimal-root");
  const sidebarNav = page.getByTestId("sidebar-nav");

  // Full shell: desktop sidebar (`hidden` + `lg:block`). Minimal shell (fatal review-detail routes): no sidebar —
  // avoid waiting forever on `sidebar-nav`.
  await sidebarNav.or(minimalRoot).waitFor({ state: "visible", timeout: 60_000 });

  if ((await minimalRoot.count()) > 0) return;

  await page.getByRole("navigation", { name: pilotNavGroupAriaLabel }).waitFor({ state: "visible", timeout: 60_000 });
}

async function navigateToReviewsViaOperatorShell(page: Page): Promise<void> {
  await waitForOperatorShellReady(page);
  await ensureCorePilotSectionExpanded(page);

  const sidebarNav = page.getByTestId("sidebar-nav");

  if ((await sidebarNav.count()) > 0) {
    const reviewsLink = sidebarNav
      .locator(`a[href="${reviewsListNavHref}"]`)
      .or(sidebarNav.getByRole("link", { name: OPERATOR_NAV_LINK_LABELS.reviewPackage }))
      .first();

    await expect(reviewsLink).toBeVisible({ timeout: 60_000 });

    await Promise.all([waitForReviewsRoute(page), reviewsLink.click()]);

    return;
  }

  const minimalRoot = page.getByTestId("app-shell-minimal-root");
  const minimalReviewsLink = minimalRoot
    .locator(`a[href="${reviewsListNavHref}"]`)
    .or(minimalRoot.getByRole("link", { name: OPERATOR_NAV_LINK_LABELS.reviewPackage }))
    .or(minimalRoot.getByRole("link", { name: "Reviews" }))
    .first();

  await expect(minimalReviewsLink).toBeVisible({ timeout: 60_000 });

  await Promise.all([waitForReviewsRoute(page), minimalReviewsLink.click()]);
}

/** Live API + SQL focus/announcer checks (merge-blocking via `ui-e2e-live`). */
test.describe("route focus and announcements", () => {
  // Default Playwright test timeout is 30s; several steps below use 60s waits — align the harness.
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    // Sidebar uses `lg:block`; pin a desktop width so CI/dev machines don't evaluate `hidden` forever.
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("skip link moves focus to main content", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });

    await page.keyboard.press("Tab");
    await page.getByRole("link", { name: "Skip to main content" }).press("Enter");

    await expect(page.locator("#main-content")).toBeFocused({ timeout: 10_000 });
  });

  test("client navigation moves focus to main content", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });
    await preventTrialWelcomeHomeAutoRedirect(page);

    await navigateToReviewsViaOperatorShell(page);

    // `waitForURL` can resolve before React's `useLayoutEffect` (route-change focus) runs; poll until the landmark is focused.
    await expect(page.locator("#main-content")).toBeFocused({ timeout: 10_000 });
  });

  test("route announcer updates after navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });
    await preventTrialWelcomeHomeAutoRedirect(page);

    await navigateToReviewsViaOperatorShell(page);

    await expect(page.getByTestId("route-announcer")).toContainText(
      `Navigated to ${RUNS_LIST_PAGE_TITLES.buyerPolished}`,
      { timeout: 10_000 },
    );
  });

  test("axe baseline passes in dark mode", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });

    await page.evaluate(() => {
      try {
        localStorage.setItem("archlucid_color_mode", "dark");
      } catch {
        /* ignore */
      }
    });

    await page.reload({ waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });

    const results = await runAxe(page, { disableRules: axeLiveE2eDisableRuleIdsNow() });
    const critical = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");

    expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
  });
});
