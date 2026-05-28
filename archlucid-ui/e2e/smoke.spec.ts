import { expect, test } from "@playwright/test";

import {
  MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN,
  RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN,
  SHOWCASE_DEMO_RUN_ID,
  SCREENSHOT_FINDING_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
} from "./fixtures";
import { askPageMainHeading, comparePageMainHeading, governancePageMainHeading } from "./helpers/operator-journey";
test.describe("operator shell smoke", () => {
  test("home renders shell headings", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ArchLucid", level: 1 })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Architecture reviews|Review packages|Claims Intake Modernization Review Package/i }),
    ).toBeVisible();
  });

  test("runs list with default project shows a run row without generic error boundary @smoke", async ({ page }) => {
    // Canonical list URL is `/reviews` (`next.config.ts` redirects `/runs`); go direct to avoid redirect flake on CI.
    await page.goto("/reviews?projectId=default");

    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
    await expect(page.locator('[data-testid^="runs-row-"]').first()).toBeVisible();
  });

  test("runs list renders without generic error boundary", async ({ page }) => {
    await page.goto("/reviews");

    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test("Ask page renders without generic error boundary", async ({ page }) => {
    await page.goto("/ask");

    await expect(askPageMainHeading(page)).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test("Help page renders primary heading", async ({ page }) => {
    await page.goto("/help");

    await expect(page.getByRole("heading", { name: /^Help$/i, level: 1 })).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test("new request page renders without generic error boundary", async ({ page }) => {
    await page.goto("/reviews/new");

    await expect(page.getByRole("heading", { name: /new architecture review/i })).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
  });
});

test.describe("operator shell smoke — core proof path", () => {
  test("home through help without generic error boundary @smoke-core-path", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/reviews?projectId=default");
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto(`/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);
    await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);

    await page.goto(`/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`);
    await expect(page.getByRole("heading", { name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN })).toBeVisible();

    await page.goto(
      `/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}/findings/${encodeURIComponent(SCREENSHOT_FINDING_ID)}`,
    );
    await expect(page.getByRole("main").first()).not.toContainText(/Something went wrong/i);

    await page.goto("/showcase/claims-intake-modernization");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    await page.goto("/ask");
    await expect(askPageMainHeading(page)).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/help");
    await expect(page.getByRole("heading", { name: /^Help$/i, level: 1 })).toBeVisible();
    await expect(page.getByRole("main").getByText(/Something went wrong/i)).toHaveCount(0);
  });
});

test.describe("operator shell smoke — advanced surface path", () => {
  test("analysis and controls routes render primary headings @smoke-advanced-path", async ({ page }) => {
    await page.goto("/ask");
    await expect(askPageMainHeading(page)).toBeVisible();
    await expect(page.getByRole("main").first().getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/graph");
    // OperatorPageHeader uses <h2>; idle EmptyState can reuse buyer vocabulary as an <h3> and would also match a broad name regex.
    await expect(
      page.getByRole("main").getByRole("heading", {
        level: 2,
        name:
          /Decision traceability graph|Evidence-to-decision graph|Review trail graph|Review evidence graph/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByTestId("graph-canvas-ready").or(page.getByRole("button", { name: /^Load graph$/i })),
    ).toBeVisible({ timeout: 25_000 });
    await expect(page.getByRole("main").first().getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/compare");
    // Buyer-polished demo shell uses "Advanced review comparison"; full operator shell uses "Compare reviews".
    await expect(comparePageMainHeading(page)).toBeVisible();
    await expect(page.getByRole("main").first().getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/governance");
    await expect(governancePageMainHeading(page)).toBeVisible();
    await expect(page.getByRole("main").first().getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/advisory");
    await expect(page.getByTestId("advisory-hub")).toBeVisible();
    await expect(page.getByRole("main").first().getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/replay");
    await expect(page.getByRole("heading", { name: /^Replay$/i })).toBeVisible();
    await expect(page.getByRole("main").first().getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/search");
    // Buyer-polished shell uses scoped vs tenant-wide search headings; full operator shell uses "Semantic Search".
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: /^(Semantic Search|Search this review's evidence|Search review evidence)$/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("main").first().getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/policy-packs");
    await expect(page.getByRole("heading", { level: 2, name: /^Policy packs$/i })).toBeVisible();
    await expect(page.getByRole("main").first().getByText(/Something went wrong/i)).toHaveCount(0);
  });
});
