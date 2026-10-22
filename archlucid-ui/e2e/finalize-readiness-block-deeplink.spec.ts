import { expect, test } from "@playwright/test";

import { buildFinalizeReadinessBlockedMock } from "./fixtures/finalize-readiness-mock";
import { FIXTURE_PRE_FINALIZE_RUN_ID } from "./fixtures/ids";
import { expectBuyerGoldenPageReady } from "./helpers/buyer-golden-path";
import { waitForAppReady } from "./helpers/waits";

async function expectBlockedPanelWithAction(
  page: import("@playwright/test").Page,
  blockCode: string,
  expectedHref: RegExp | string,
): Promise<void> {
  const blockedPanel = page.getByTestId("commit-blocked-finding-coverage");
  await expect(blockedPanel).toBeVisible({ timeout: 60_000 });
  await expect(blockedPanel).toContainText("Finalize is blocked");

  const action = page.getByTestId(`finalize-readiness-block-action-${blockCode}`);
  await expect(action).toBeVisible();
  await expect(action).toHaveAttribute("href", expectedHref);
  await action.click();
  await expect(page).toHaveURL(typeof expectedHref === "string" ? expectedHref : expectedHref);
}

test.describe(
  "finalize readiness block deep-links @demo-readiness",
  { tag: ["@founder", "@critical"] },
  () => {
    test("deferred scorecard block navigates to the deferred findings job view", async ({ page }) => {
      test.setTimeout(120_000);

      await page.goto(`/architecture/reviews/${encodeURIComponent(FIXTURE_PRE_FINALIZE_RUN_ID)}`);

      await waitForAppReady(page);
      await expectBuyerGoldenPageReady(page);

      await expectBlockedPanelWithAction(
        page,
        "scorecard",
        `/architecture/reviews/${encodeURIComponent(FIXTURE_PRE_FINALIZE_RUN_ID)}?reviewTab=findings&findingJobView=deferred`,
      );

      await expect(page.getByTestId("review-detail-workspace-panel-findings")).toBeVisible({ timeout: 60_000 });
    });

    test("lifecycle integrity block navigates to the activity tab", async ({ page }) => {
      test.setTimeout(120_000);

      await page.route("**/v1/governance/pre-finalize/readiness/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            buildFinalizeReadinessBlockedMock(FIXTURE_PRE_FINALIZE_RUN_ID, {
              layer: "integrity",
              code: "lifecycle_phase_incomplete",
              message: "Commit blocked: authority lifecycle phase is InProgress; pipeline must be Complete before seal.",
            }),
          ),
        });
      });

      await page.goto(`/architecture/reviews/${encodeURIComponent(FIXTURE_PRE_FINALIZE_RUN_ID)}`);

      await waitForAppReady(page);
      await expectBuyerGoldenPageReady(page);

      await expectBlockedPanelWithAction(
        page,
        "lifecycle_phase_incomplete",
        new RegExp(`reviewTab=activity`),
      );

      await expect(page.getByTestId("review-detail-workspace-panel-activity")).toBeVisible({ timeout: 60_000 });
    });

    test("evidence integrity block navigates to the findings tab", async ({ page }) => {
      test.setTimeout(120_000);

      await page.route("**/v1/governance/pre-finalize/readiness/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            buildFinalizeReadinessBlockedMock(FIXTURE_PRE_FINALIZE_RUN_ID, {
              layer: "integrity",
              code: "evidence_referential_integrity",
              message: "Commit blocked: finding evidence referential integrity failed.",
            }),
          ),
        });
      });

      await page.goto(`/architecture/reviews/${encodeURIComponent(FIXTURE_PRE_FINALIZE_RUN_ID)}`);

      await waitForAppReady(page);
      await expectBuyerGoldenPageReady(page);

      await expectBlockedPanelWithAction(
        page,
        "evidence_referential_integrity",
        `/architecture/reviews/${encodeURIComponent(FIXTURE_PRE_FINALIZE_RUN_ID)}?reviewTab=findings`,
      );

      await expect(page.getByTestId("review-detail-workspace-panel-findings")).toBeVisible({ timeout: 60_000 });
    });

    test("architecture version pin block navigates to the activity tab", async ({ page }) => {
      test.setTimeout(120_000);

      await page.route("**/v1/governance/pre-finalize/readiness/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            buildFinalizeReadinessBlockedMock(FIXTURE_PRE_FINALIZE_RUN_ID, {
              layer: "integrity",
              code: "architecture_version_pin",
              message: "Commit blocked: create-time architecture version content hash (κ) drifted since run create.",
            }),
          ),
        });
      });

      await page.goto(`/architecture/reviews/${encodeURIComponent(FIXTURE_PRE_FINALIZE_RUN_ID)}`);

      await waitForAppReady(page);
      await expectBuyerGoldenPageReady(page);

      await expectBlockedPanelWithAction(
        page,
        "architecture_version_pin",
        new RegExp(`reviewTab=activity`),
      );

      await expect(page.getByTestId("review-detail-workspace-panel-activity")).toBeVisible({ timeout: 60_000 });
    });

    test("create-time pin integrity block navigates to the activity tab", async ({ page }) => {
      test.setTimeout(120_000);

      await page.route("**/v1/governance/pre-finalize/readiness/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            buildFinalizeReadinessBlockedMock(FIXTURE_PRE_FINALIZE_RUN_ID, {
              layer: "integrity",
              code: "create_time_pin_integrity",
              message: "Commit blocked: policy pack pin JSON no longer matches the stored create-time pin hash.",
            }),
          ),
        });
      });

      await page.goto(`/architecture/reviews/${encodeURIComponent(FIXTURE_PRE_FINALIZE_RUN_ID)}`);

      await waitForAppReady(page);
      await expectBuyerGoldenPageReady(page);

      await expectBlockedPanelWithAction(
        page,
        "create_time_pin_integrity",
        new RegExp(`reviewTab=activity`),
      );

      await expect(page.getByTestId("review-detail-workspace-panel-activity")).toBeVisible({ timeout: 60_000 });
    });

    test("pre-commit gate block navigates to finalize readiness anchor", async ({ page }) => {
      test.setTimeout(120_000);

      await page.route("**/v1/governance/pre-finalize/readiness/**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(
            buildFinalizeReadinessBlockedMock(FIXTURE_PRE_FINALIZE_RUN_ID, {
              layer: "governance",
              code: "pre_commit_gate",
              message: "Commit blocked: pre-commit governance gate found blocking findings.",
            }),
          ),
        });
      });

      await page.goto(`/architecture/reviews/${encodeURIComponent(FIXTURE_PRE_FINALIZE_RUN_ID)}`);

      await waitForAppReady(page);
      await expectBuyerGoldenPageReady(page);

      await expectBlockedPanelWithAction(
        page,
        "pre_commit_gate",
        new RegExp(`architecture-assessment-progress`),
      );
    });
  },
);
