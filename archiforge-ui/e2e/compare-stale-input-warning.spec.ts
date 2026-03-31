import { expect, test } from "@playwright/test";

import {
  FIXTURE_LEFT_RUN_ID,
  FIXTURE_RIGHT_RUN_ID,
  fixtureGoldenManifestComparison,
  fixtureLegacyRunComparison,
} from "./fixtures";
import { registerOperatorJourneyApiRoutes } from "./helpers/register-operator-api-routes";

test.describe("operator journey — compare stale input warning", () => {
  test("shows when run IDs change after a successful compare, clears when values match last request again", async ({
    page,
  }) => {
    await registerOperatorJourneyApiRoutes(page, {
      legacyCompare: {
        leftRunId: FIXTURE_LEFT_RUN_ID,
        rightRunId: FIXTURE_RIGHT_RUN_ID,
        body: fixtureLegacyRunComparison(),
      },
      structuredCompare: {
        baseRunId: FIXTURE_LEFT_RUN_ID,
        targetRunId: FIXTURE_RIGHT_RUN_ID,
        body: fixtureGoldenManifestComparison(),
      },
    });

    const q = new URLSearchParams({
      leftRunId: FIXTURE_LEFT_RUN_ID,
      rightRunId: FIXTURE_RIGHT_RUN_ID,
    });
    await page.goto(`/compare?${q.toString()}`);

    await page.getByRole("button", { name: "Compare" }).click();
    await expect(page.getByRole("region", { name: "Comparison request outcome" })).toBeVisible();

    const leftInput = page.getByPlaceholder("Base run ID (left)");
    await leftInput.fill(`${FIXTURE_LEFT_RUN_ID}-edited`);

    const staleCallout = page.getByRole("status").filter({
      has: page.getByText("Run IDs no longer match the results below.", { exact: true }),
    });
    await expect(staleCallout).toBeVisible();
    await expect(staleCallout.getByText(/Content below still reflects/)).toBeVisible();
    await expect(staleCallout.getByRole("code").filter({ hasText: FIXTURE_LEFT_RUN_ID })).toBeVisible();
    await expect(staleCallout.getByRole("code").filter({ hasText: FIXTURE_RIGHT_RUN_ID })).toBeVisible();
    await expect(staleCallout.getByText(/restore the previous values/)).toBeVisible();

    await leftInput.fill(FIXTURE_LEFT_RUN_ID);
    await expect(
      page.getByText("Run IDs no longer match the results below.", { exact: true }),
    ).not.toBeVisible();
  });
});
