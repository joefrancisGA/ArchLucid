import { expect, test } from "@playwright/test";

import {
  START_REVIEW_PAGE_HEADING_PATTERN,
  MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN,
  RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN,
  SHOWCASE_DEMO_RUN_ID,
  SCREENSHOT_FINDING_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
} from "./fixtures";
import { getAppMain } from "./helpers/app-main";
import { reviewsHubFirstPackageRow } from "./helpers/reviews-hub";
import { askPageMainHeading, comparePageMainHeading, expectGraphPageReadySurface, governancePageMainHeading } from "./helpers/operator-journey";
test.describe("operator shell smoke", () => {
  test("home renders shell headings", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ArchLucid", level: 1 })).toBeVisible();
    const appMain = page.getByTestId("app-shell-main");
    await expect(
      appMain
        .getByTestId("operator-home-hero-section")
        .getByTestId("pilot-command-center-card")
        .or(appMain.getByTestId("operator-home-pilot-command-center-host").getByTestId("pilot-command-center-card")),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent reviews", level: 2 })).toBeVisible();
  });

  test("runs list with default project shows a run row without generic error boundary @smoke", async ({ page }) => {
    // Canonical list URL is `/architecture/reviews`; go direct to avoid flake on CI.
    await page.goto("/architecture/reviews");

    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);
    await expect(reviewsHubFirstPackageRow(getAppMain(page))).toBeVisible();
  });

  test("runs list renders without generic error boundary", async ({ page }) => {
    await page.goto("/architecture/reviews");

    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test("Ask page renders without generic error boundary", async ({ page }) => {
    await page.goto("/insights/ask-review-questions");

    await expect(askPageMainHeading(page)).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test("Help page renders primary heading", async ({ page }) => {
    await page.goto("/help");

    await expect(page.getByRole("heading", { name: /^Help$/i, level: 1 })).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test("new request page renders without generic error boundary", async ({ page }) => {
    await page.goto("/architecture/reviews/new");

    await expect(
      page.getByRole("heading", { level: 1, name: START_REVIEW_PAGE_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);
  });
});

test.describe("operator shell smoke — core proof path", () => {
  test("home through help without generic error boundary @smoke-core-path", async ({ page }) => {
    await page.goto("/");
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/architecture/reviews");
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto(`/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}`);
    await expect(getAppMain(page)).not.toContainText(/Something went wrong/i);

    await page.goto(`/governance/sealed-records/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`);
    await expect(page.getByRole("heading", { level: 1, name: MANIFEST_DETAIL_PRIMARY_HEADING_PATTERN })).toBeVisible();

    await page.goto(
      `/architecture/reviews/${encodeURIComponent(SHOWCASE_DEMO_RUN_ID)}/findings/${encodeURIComponent(SCREENSHOT_FINDING_ID)}`,
    );
    await expect(getAppMain(page)).not.toContainText(/Something went wrong/i);

    await page.goto("/showcase/customer-intake-modernization");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    await page.goto("/insights/ask-review-questions");
    await expect(askPageMainHeading(page)).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/help");
    await expect(page.getByRole("heading", { name: /^Help$/i, level: 1 })).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);
  });
});

test.describe("operator shell smoke — advanced surface path", () => {
  test("analysis and controls routes render primary headings @smoke-advanced-path", async ({ page }) => {
    await page.goto("/insights/ask-review-questions");
    await expect(askPageMainHeading(page)).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/insights/evidence-graph");
    await expectGraphPageReadySurface(page, { timeout: 25_000 });
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/insights/compare-two-reviews");
    await expect(comparePageMainHeading(page)).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/governance/approval-queue");
    await expect(governancePageMainHeading(page)).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/governance/advisory-scans");
    await expect(page.getByTestId("advisory-hub")).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/internal/validate-route");
    await expect(page.getByRole("heading", { name: /^Validate review$/i })).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/insights/search-review-evidence");
    // Tenant-wide or scoped search headings depending on optional review filter.
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: /^(Search this review's evidence|Search review evidence)$/i,
      }),
    ).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/governance/policy-packs");
    await expect(page.getByRole("heading", { level: 2, name: /^Policy packs$/i })).toBeVisible();
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);

    await page.goto("/governance/sealed-records");
    await expect(page.getByTestId("signed-records-list-page-title")).toHaveText("Sealed review records");
    await expect(getAppMain(page).getByText(/Something went wrong/i)).toHaveCount(0);
  });
});
