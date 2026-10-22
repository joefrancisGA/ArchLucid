import { expect, test } from "@playwright/test";

const sponsorOnlyMeBody = {
  name: "Sponsor Sponsor",
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

test.describe("Sponsor sponsor shell redirect @sponsor-redirect", () => {
  test("Sponsor-only principal stays on canonical reviews list", async ({ page }) => {
    await stubSponsorOnlyPrincipal(page);
    await page.goto("/architecture/reviews");

    await expect(page).toHaveURL(/\/architecture\/reviews(\?projectId=default)?$/, { timeout: 15_000 });
  });

  test("Sponsor-only deep link to review detail stays on operator reviews shell", async ({ page }) => {
    await stubSponsorOnlyPrincipal(page);
    await page.goto("/architecture/reviews/demo-run-id");

    await expect(page).toHaveURL(/\/architecture\/reviews\/demo-run-id$/, { timeout: 15_000 });
  });

  test("Sponsor-only principal is redirected from governance workflow to dashboard", async ({ page }) => {
    await stubSponsorOnlyPrincipal(page);
    await page.goto("/governance/approval-queue?runId=claims-intake-modernization");

    await expect(page).toHaveURL(/\/architecture\/sponsor-dashboard(\?runId=claims-intake-modernization)?$/, { timeout: 15_000 });
  });
});
