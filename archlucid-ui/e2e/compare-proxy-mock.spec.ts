import { expect, test } from "@playwright/test";

import { FIXTURE_LEFT_RUN_ID, FIXTURE_RIGHT_RUN_ID } from "./fixtures";
import { comparePageSubmitButton } from "./helpers/operator-journey";
import { registerCompareAndExplainRoutes } from "./helpers/register-operator-api-routes";

test.describe("operator journey — compare proxy mocks", () => {
  test("client compare + explain calls are fulfilled without a live API", async ({ page }) => {
    await registerCompareAndExplainRoutes(page);

    const q = new URLSearchParams({
      leftRunId: FIXTURE_LEFT_RUN_ID,
      rightRunId: FIXTURE_RIGHT_RUN_ID,
    });
    await page.goto(`/compare?${q.toString()}`);

    const compareSubmit = comparePageSubmitButton(page);
    await expect(compareSubmit).toBeEnabled();
    await compareSubmit.click();
    await expect(page.getByText(/Fixture highlight alpha/i)).toBeVisible();

    await page.getByRole("button", { name: "Summarize for sponsor", exact: true }).click();
    await expect(page.getByText("E2E fixture: target run adds capacity", { exact: false })).toBeVisible();
  });
});
