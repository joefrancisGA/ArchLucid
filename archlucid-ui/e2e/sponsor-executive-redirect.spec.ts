import { expect, test } from "@playwright/test";

const sponsorOnlyMeBody = {
  name: "Executive Sponsor",
  claims: [{ type: "roles", value: "Sponsor" }],
  hasCommittedArchitectureReview: false,
};

async function stubSponsorOnlyPrincipal(page: import("@playwright/test").Page): Promise<void> {
  await page.route("**/api/proxy/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(sponsorOnlyMeBody),
    });
  });
}

test.describe("Sponsor executive shell redirect @sponsor-redirect", () => {
  test("Sponsor-only principal is redirected from operator reviews to executive reviews", async ({ page }) => {
    await stubSponsorOnlyPrincipal(page);
    await page.goto("/reviews?projectId=default");

    await expect(page).toHaveURL(/\/executive\/reviews(\?projectId=default)?$/, { timeout: 15_000 });
  });

  test("Sponsor-only deep link to review detail maps to executive shell", async ({ page }) => {
    await stubSponsorOnlyPrincipal(page);
    await page.goto("/reviews/demo-run-id");

    await expect(page).toHaveURL(/\/executive\/reviews\/demo-run-id$/, { timeout: 15_000 });
  });
});
