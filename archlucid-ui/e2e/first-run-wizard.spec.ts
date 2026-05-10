import { expect, test } from "@playwright/test";

test.describe("first-run wizard", () => {
  test("new run page renders wizard shell", async ({ page }) => {
    await page.goto("/runs/new");

    await expect(page.getByRole("heading", { name: /new architecture request/i, level: 2 })).toBeVisible();
    await expect(
      page.getByText(
        "Start fast with a pasted brief (Quick review) or use the full multi-step wizard with templates and imports.",
      ),
    ).toBeVisible();
  });
});
