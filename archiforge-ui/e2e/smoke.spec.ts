import { expect, test } from "@playwright/test";

test.describe("operator shell smoke", () => {
  test("home renders shell headings", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "ArchiForge" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Operator Shell" })).toBeVisible();
  });
});
