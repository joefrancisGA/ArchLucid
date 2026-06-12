import { expect, test } from "@playwright/test";

test.describe("first-run wizard", () => {
  test("new run page renders wizard shell", async ({ page }) => {
    await page.goto("/reviews/new");

    await expect(page.getByRole("heading", { name: /new architecture review/i, level: 2 })).toBeVisible();
    await expect(
      page.getByText(
        "Start fast with Quick review (guided defaults), or open Full guided review for intake questions, templates, and imports.",
      ),
    ).toBeVisible();
  });
});
