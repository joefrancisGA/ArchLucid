import { expect, test } from "@playwright/test";

import {
  BUYER_ONBOARDING_PAGE_TITLE,
  FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE,
} from "@/lib/buyer/buyer-polish-copy";

import { SHOWCASE_DEMO_RUN_ID } from "../e2e/fixtures/ids";
import { registerFreshTenantOnboardingMocks } from "../e2e/helpers/register-onboarding-mocks";

/**
 * Headless first-run journey with mocked API responses:
 * fresh tenant signup → verify handoff → onboarding checklist → identity catalog (Entra-style JWT alignment).
 *
 * There is no standalone “EULA checkbox” in product UI; trial signup documents acknowledgment inline (“By continuing you
 * agree … privacy policy”), which this spec treats as the legal acceptance gate before provisioning.
 */
test.describe("Fresh tenant onboarding — mocked API", () => {
  test.setTimeout(120_000);

  test("signup acknowledgment, verify handoff, onboarding rail, and identity provider catalog", async ({ page }) => {
    await registerFreshTenantOnboardingMocks(page);

    await page.goto("/signup");

    await expect(page.getByRole("heading", { name: /start your evaluation/i })).toBeVisible();

    await expect(page.getByText(/We use this information to create your evaluation workspace/i)).toBeVisible();
    await expect(page.locator("form").getByRole("link", { name: /privacy policy/i })).toBeVisible();
    await expect(page.locator("form").getByRole("link", { name: /assurance status/i })).toBeVisible();

    await page.getByLabel(/Work email/i).fill("fresh-tenant@example.com");
    await page.getByLabel(/Full name/i).fill("Fresh Tenant Admin");
    await page.getByLabel(/Organization name/i).fill("Contoso Fresh Tenant Org");

    await page.getByRole("button", { name: /Create evaluation workspace/i }).click();

    await expect(page).toHaveURL(/\/signup\/verify\?email=fresh-tenant%40example\.com/);

    await page.getByTestId("signup-verify-continue-onboarding").click();

    await expect(page).toHaveURL(/\/architecture\/first-review-guide\?source=registration/);

    await expect(page.getByRole("heading", { name: BUYER_ONBOARDING_PAGE_TITLE, level: 1 })).toBeVisible();

    await expect(
      page.getByRole("heading", { name: FIRST_REVIEW_GUIDE_PROGRESS_SECTION_TITLE, level: 2 }),
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.getByRole("link", { name: "Explore sample review" })).toHaveAttribute(
      "href",
      `/architecture/reviews/${SHOWCASE_DEMO_RUN_ID}`,
    );

    await expect(page.getByTestId("first-review-guide-walkthrough")).toBeVisible({ timeout: 30_000 });

    await Promise.all([
      page.waitForResponse(
        (response) => response.url().includes("/api/proxy/api/auth/me") && response.ok(),
        { timeout: 60_000 },
      ),
      page.goto("/administration/identity-providers"),
    ]);

    await expect(page.getByTestId("identity-providers-settings-shell")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "Identity providers", level: 2 })).toBeVisible({
      timeout: 60_000,
    });

    await expect(page.getByTestId("identity-providers-overview-summary")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("identity-providers-settings-nav")).toBeVisible();
    await expect(page.getByTestId("identity-providers-recommended-next-card")).toBeVisible();

    await expect(page.getByTestId("identity-providers-table")).toHaveCount(0);
  });
});
