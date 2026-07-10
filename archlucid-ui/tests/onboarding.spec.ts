import { expect, test } from "@playwright/test";

import { BUYER_ONBOARDING_PAGE_TITLE } from "@/lib/buyer-polish-copy";

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
    await expect(page.getByRole("link", { name: /privacy policy/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /security and trust/i })).toBeVisible();

    await page.getByLabel(/Work email/i).fill("fresh-tenant@example.com");
    await page.getByLabel(/Full name/i).fill("Fresh Tenant Admin");
    await page.getByLabel(/Organization name/i).fill("Contoso Fresh Tenant Org");

    await page.getByRole("button", { name: /Create evaluation workspace/i }).click();

    await expect(page).toHaveURL(/\/signup\/verify\?email=fresh-tenant%40example\.com/);

    await page.getByTestId("signup-verify-continue-onboarding").click();

    await expect(page).toHaveURL(/\/onboarding\?source=registration/);

    await expect(page.getByRole("heading", { name: BUYER_ONBOARDING_PAGE_TITLE, level: 1 })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Progress", level: 2 })).toBeVisible({ timeout: 30_000 });

    await expect(page.getByTestId("onboarding-open-sample-run")).toBeVisible();
    await expect(page.getByTestId("onboarding-open-sample-run")).toHaveAttribute(
      "href",
      `/reviews/${SHOWCASE_DEMO_RUN_ID}`,
    );

    await expect(page.getByTestId("core-pilot-checklist")).toBeVisible({ timeout: 30_000 });

    await page.goto("/settings/identity-providers");

    await expect(page.getByRole("heading", { name: "Identity providers", level: 1 })).toBeVisible();

    const catalog = page.getByTestId("identity-providers-table");
    await expect(catalog).toBeVisible({ timeout: 30_000 });

    await expect(catalog.getByRole("cell", { name: "ArchLucidAuth:Authority", exact: true })).toBeVisible();
    await expect(catalog.getByRole("cell", { name: "ArchLucidAuth:Audience", exact: true })).toBeVisible();

    await expect(catalog.getByRole("row").filter({ hasText: "ArchLucidAuth:Authority" }).first()).toContainText(
      "login.microsoftonline.com",
    );
    await expect(catalog.getByRole("row").filter({ hasText: "ArchLucidAuth:Audience" }).first()).toContainText(
      "api://archlucid-onboarding-demo",
    );
  });
});
