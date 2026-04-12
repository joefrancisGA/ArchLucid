import { expect, test } from "@playwright/test";

test.describe("policy packs — mock API journey", () => {
  test("create, publish, assign surfaces effective merged content", async ({ page }) => {
    await page.goto("/policy-packs");

    await expect(page.getByRole("heading", { name: "Policy packs", level: 2 })).toBeVisible();

    const publishButton = page.getByRole("button", { name: "Publish" });
    const assignButton = page.getByRole("button", { name: "Assign" });

    await page.getByRole("button", { name: "Create pack" }).click();
    // Create runs load(); Assign/Publish stay disabled until packs + selectedPackId are ready.
    await expect(publishButton).toBeEnabled({ timeout: 60_000 });

    await publishButton.click();
    // Publish runs load() again; wait before clicking Assign so the button is stable and enabled.
    await expect(assignButton).toBeEnabled({ timeout: 60_000 });
    await assignButton.click();

    await expect(page.getByText("e2e-mock-rule", { exact: false })).toBeVisible({ timeout: 60_000 });
  });
});
