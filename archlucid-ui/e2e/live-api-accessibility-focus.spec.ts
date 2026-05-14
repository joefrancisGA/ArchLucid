import { expect, test, type Page } from "@playwright/test";

import { runAxe } from "./helpers/axe-helper";

/**
 * Pilot group `<nav aria-label>` — always `group.label` from `PilotNavGroupBuilder` (`SidebarNav` sets `aria-label={group.label}`).
 * The disclosure **button** label is `group.label` in full-operator mode and `"Review list"` when buyer-polished (`isBuyerPolishedOperatorShellEnv`).
 */
const pilotNavGroupAriaLabel = "Review work";

const pilotSectionDisclosureName = /^(Review work|Review list)$/;

/** Expands the pilot nav collapsible when `localStorage` left it closed so sidebar links are in the a11y tree. */
async function ensureCorePilotSectionExpanded(page: Page): Promise<void> {
  const minimalRoot = page.getByTestId("app-shell-minimal-root");
  const sidebarNav = page.getByTestId("sidebar-nav");

  // Full shell: desktop sidebar (`hidden` + `lg:block`). Minimal shell (fatal review-detail routes): no sidebar —
  // avoid waiting forever on `sidebar-nav`.
  await sidebarNav.or(minimalRoot).waitFor({ state: "visible", timeout: 60_000 });

  if ((await minimalRoot.count()) > 0) return;

  // Pilot disclosure label is **Review work** or buyer-polished **Review list** — not route title **Architecture reviews**.
  const trigger = page.getByRole("button", { name: pilotSectionDisclosureName });

  await trigger.waitFor({ state: "visible", timeout: 60_000 });

  if ((await trigger.getAttribute("aria-expanded")) === "false") await trigger.click();
}

/** Pilot **Reviews** link (sidebar) or minimal-shell header fallback — both honor SPA routing + route announcer. */
async function navigateToReviewsViaOperatorShell(page: Page): Promise<void> {
  await ensureCorePilotSectionExpanded(page);

  const pilotReviews = page
    .getByRole("navigation", { name: pilotNavGroupAriaLabel })
    .getByRole("link", { name: "Reviews" });

  if ((await pilotReviews.count()) > 0) {
    await pilotReviews.click();

    return;
  }

  await page.getByTestId("app-shell-minimal-root").getByRole("link", { name: "Reviews" }).click();
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

    await navigateToReviewsViaOperatorShell(page);

    await page.waitForURL("**/reviews**", { timeout: 60_000 });

    // `waitForURL` can resolve before React's `useLayoutEffect` (route-change focus) runs; poll until the landmark is focused.
    await expect(page.locator("#main-content")).toBeFocused({ timeout: 10_000 });
  });

  test("route announcer updates after navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.locator("main").first().waitFor({ state: "visible", timeout: 60_000 });

    await navigateToReviewsViaOperatorShell(page);
    await page.waitForURL("**/reviews**", { timeout: 60_000 });

    await expect(page.getByTestId("route-announcer")).toContainText("Navigated to Architecture reviews", {
      timeout: 10_000,
    });
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

    const results = await runAxe(page);
    const critical = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");

    expect(critical, JSON.stringify(critical, null, 2)).toHaveLength(0);
  });
});
