import { expect, test, type Page } from "@playwright/test";

import { OPERATOR_NAV_LINK_LABELS, RUNS_LIST_PAGE_TITLES } from "@/lib/i18n";

import { axeLiveE2eDisableRuleIdsNow } from "./axe-rule-allowlist";
import { runAxe } from "./helpers/axe-helper";

/**
 * Pilot group `<nav aria-label>` — always `group.label` from `PilotNavGroupBuilder` (`SidebarNav` sets `aria-label={group.label}`).
 */
const pilotNavGroupAriaLabel = "Architecture";

/** Canonical reviews list route — pilot sidebar + minimal-shell header both link here. */
const reviewsListNavHref = "/architecture/reviews";

/** Client-side App Router navigations do not emit `load`; `commit` matches soft route changes. */
const reviewsRouteUrlPattern = /\/reviews(?:\/|\?|$|#)/;

/** Session guard key — must match `TrialWelcomeRunDeepLink`. */
const trialWelcomeHomeRedirectSessionKey = "archlucid_trial_welcome_home_redirect_v1";

/** Must match `TRIAL_WELCOME_HOME_REDIRECT_SUPPRESS_VALUE` in `TrialWelcomeRunDeepLink`. */
const trialWelcomeHomeRedirectSuppressValue = "__suppress__";

/**
 * Stable non-home operator surface with the full sidebar. Home (`/`) remains a separate regression
 * case (heavy Overview + `loading.tsx` soft-nav stall on Next 16.2.x); prefer
 * `/architecture/first-review-guide` for focus/announcer soft-nav checks that must stay reliable
 * across framework versions.
 */
const clientNavigationStartPath = "/architecture/first-review-guide";

async function waitForOperatorShellReady(page: Page): Promise<void> {
  await page.locator('[data-app-ready="true"]').waitFor({ state: "attached", timeout: 60_000 });
  await expect(page.getByTestId("operator-shell-access-gate-loading")).toHaveCount(0, { timeout: 60_000 });
}

function isOnReviewsRoute(page: Page): boolean {
  return reviewsRouteUrlPattern.test(page.url());
}

async function waitForReviewsRoute(page: Page): Promise<void> {
  await page.waitForURL(reviewsRouteUrlPattern, { timeout: 60_000, waitUntil: "commit" });
}

/** Suppress trial-welcome deep link for any incidental visit to `/` during the test. */
async function installTrialWelcomeRedirectSuppress(page: Page): Promise<void> {
  await page.addInitScript(
    ([sessionKey, suppressValue]) => {
      try {
        sessionStorage.setItem(sessionKey, suppressValue);
      } catch {
        /* ignore */
      }
    },
    [trialWelcomeHomeRedirectSessionKey, trialWelcomeHomeRedirectSuppressValue] as const,
  );
}

/** Operator shell ready on a non-home route — auth resolved, no trial welcome redirect race. */
async function prepareOperatorShellForClientNavigation(page: Page): Promise<void> {
  await installTrialWelcomeRedirectSuppress(page);
  await page.goto(clientNavigationStartPath, { waitUntil: "load" });
  await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });
  await waitForOperatorShellReady(page);

  // Guard against an unexpected bounce to `/` (or elsewhere) before we click Reviews.
  if (!page.url().includes(clientNavigationStartPath)) {
    await page.goto(clientNavigationStartPath, { waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });
    await waitForOperatorShellReady(page);
  }
}

/** Waits until the desktop sidebar pilot nav cluster is visible (links are always expanded). */
async function ensureCorePilotSectionExpanded(page: Page): Promise<void> {
  const minimalRoot = page.getByTestId("app-shell-minimal-root");
  const sidebarNav = page.getByTestId("sidebar-nav");

  await sidebarNav.or(minimalRoot).waitFor({ state: "visible", timeout: 60_000 });

  if ((await minimalRoot.count()) > 0) return;

  await page.getByRole("navigation", { name: pilotNavGroupAriaLabel }).waitFor({ state: "visible", timeout: 60_000 });
}

function reviewsNavLink(page: Page) {
  const sidebarNav = page.getByTestId("sidebar-nav");
  const minimalRoot = page.getByTestId("app-shell-minimal-root");

  return sidebarNav
    .getByTestId("nav-pilot-reviews-list")
    .or(sidebarNav.locator(`a[href="${reviewsListNavHref}"]`))
    .or(sidebarNav.getByRole("link", { name: OPERATOR_NAV_LINK_LABELS.reviewPackage, exact: true }))
    .or(minimalRoot.getByTestId("nav-pilot-reviews-list"))
    .or(minimalRoot.locator(`a[href="${reviewsListNavHref}"]`))
    .or(minimalRoot.getByRole("link", { name: OPERATOR_NAV_LINK_LABELS.reviewPackage, exact: true }))
    .first();
}

async function navigateToReviewsViaOperatorShell(page: Page): Promise<void> {
  await waitForOperatorShellReady(page);
  await ensureCorePilotSectionExpanded(page);

  const link = reviewsNavLink(page);
  await expect(link).toBeVisible({ timeout: 60_000 });
  await link.scrollIntoViewIfNeeded();

  // Attempt 1: normal Playwright click on the Next.js Link.
  await Promise.all([
    page.waitForURL(reviewsRouteUrlPattern, { timeout: 12_000, waitUntil: "commit" }).catch(() => undefined),
    link.click({ noWaitAfter: true }),
  ]);

  if (isOnReviewsRoute(page)) {
    return;
  }

  // Attempt 2: keyboard activation (still a real Link navigation).
  await link.focus();
  await Promise.all([
    page.waitForURL(reviewsRouteUrlPattern, { timeout: 12_000, waitUntil: "commit" }).catch(() => undefined),
    page.keyboard.press("Enter"),
  ]);

  if (isOnReviewsRoute(page)) {
    return;
  }

  // Attempt 3: shell shortcut → `router.push` (same destination as the sidebar link).
  await page.locator("main").first().click({ position: { x: 8, y: 8 } }).catch(() => undefined);
  await Promise.all([
    page.waitForURL(reviewsRouteUrlPattern, { timeout: 12_000, waitUntil: "commit" }).catch(() => undefined),
    page.keyboard.press("Alt+r"),
  ]);

  if (isOnReviewsRoute(page)) {
    return;
  }

  // Attempt 4: DOM click without Playwright actionability wrapping.
  await Promise.all([
    page.waitForURL(reviewsRouteUrlPattern, { timeout: 20_000, waitUntil: "commit" }).catch(() => undefined),
    link.evaluate((el: HTMLElement) => {
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    }),
  ]);

  await waitForReviewsRoute(page);
}

/** Live API + SQL focus/announcer checks (merge-blocking via `ui-e2e-live`). */
test.describe("route focus and announcements", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("skip link moves focus to main content", async ({ page }) => {
    await installTrialWelcomeRedirectSuppress(page);
    await page.goto("/", { waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });

    await page.keyboard.press("Tab");
    await page.getByRole("link", { name: "Skip to main content" }).press("Enter");

    await expect(page.locator("#main-content")).toBeFocused({ timeout: 10_000 });
  });

  test("client navigation moves focus to main content", async ({ page }) => {
    await prepareOperatorShellForClientNavigation(page);

    await navigateToReviewsViaOperatorShell(page);

    await expect(page.locator("#main-content")).toBeFocused({ timeout: 10_000 });
  });

  test("soft navigation from Overview commits Reviews without hard reload", async ({ page }) => {
    await installTrialWelcomeRedirectSuppress(page);
    await page.goto("/", { waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });
    await waitForOperatorShellReady(page);

    // Document navigations mean hard assign/reload recovered; App Router soft-nav must win instead.
    let sawReviewsDocumentNavigation = false;
    page.on("request", (request) => {
      if (!request.isNavigationRequest()) {
        return;
      }

      if (reviewsRouteUrlPattern.test(request.url())) {
        sawReviewsDocumentNavigation = true;
      }
    });

    await navigateToReviewsViaOperatorShell(page);

    await expect(page).toHaveURL(reviewsRouteUrlPattern);
    expect(sawReviewsDocumentNavigation).toBe(false);
  });

  test("route announcer updates after navigation", async ({ page }) => {
    await prepareOperatorShellForClientNavigation(page);

    await navigateToReviewsViaOperatorShell(page);

    await expect(page.getByTestId("route-announcer")).toContainText(
      `Navigated to ${RUNS_LIST_PAGE_TITLES.buyerPolished}`,
      { timeout: 10_000 },
    );
  });

  test("axe baseline passes in dark mode", async ({ page }) => {
    await installTrialWelcomeRedirectSuppress(page);
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
