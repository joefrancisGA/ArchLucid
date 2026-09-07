/**
 * SCIM-as-invite-substitute smoke (TB-797 wave 2+4): page load, vocabulary rail,
 * and admin token issue → list → revoke lifecycle under JwtBearer.
 */
import { expect, test } from "@playwright/test";

import { primeJwtBrowserSession, requireLivePrivateBetaJwtEnv } from "./helpers/live-private-beta-access";
import { resolveLiveJwtMode } from "./helpers/live-api-client";
import { SCIM_CREATE_DIALOG_CONFIRM, SCIM_REVOKE_DIALOG_CONFIRM } from "@/lib/scim-provisioning-page-copy";

test.describe("live-api-scim-invite-substitute-smoke", { tag: ["@release-gate"] }, () => {
  test.skip(!resolveLiveJwtMode(), "Set LIVE_JWT_TOKEN to run SCIM invite-substitute smoke.");

  test("SCIM provisioning page loads vocabulary rail linking to Users invite", async ({ page }) => {
    test.setTimeout(120_000);

    const { accessToken } = requireLivePrivateBetaJwtEnv();

    await primeJwtBrowserSession(page, accessToken);
    await page.goto("/administration/scim-provisioning", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("scim-provisioning-settings-page")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("scim-identity-providers-vocabulary")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: /Users invite/i })).toBeVisible({ timeout: 30_000 });
  });

  test("SCIM admin can issue, list, and revoke a provisioning token", async ({ page }) => {
    test.setTimeout(180_000);

    const { accessToken } = requireLivePrivateBetaJwtEnv();

    await primeJwtBrowserSession(page, accessToken);
    await page.goto("/administration/scim-provisioning", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("scim-provisioning-settings-page")).toBeVisible({ timeout: 60_000 });
    await page.getByTestId("scim-create-token").click();

    const createDialog = page.getByRole("alertdialog");
    await expect(createDialog).toBeVisible({ timeout: 15_000 });
    await createDialog.getByRole("button", { name: SCIM_CREATE_DIALOG_CONFIRM }).click();

    await expect(page.getByTestId("scim-token-reveal")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("scim-token-done").click();

    await expect(page.getByTestId("scim-active-tokens-table")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("scim-no-tokens-empty-state")).toHaveCount(0);

    const revokeButton = page.locator('[data-testid^="scim-revoke-token-"]').first();
    await expect(revokeButton).toBeVisible({ timeout: 30_000 });
    await revokeButton.click();

    const revokeDialog = page.getByRole("alertdialog");
    await expect(revokeDialog).toBeVisible({ timeout: 15_000 });
    await revokeDialog.getByRole("button", { name: SCIM_REVOKE_DIALOG_CONFIRM }).click();

    await expect(page.getByTestId("scim-mutation-success-callout")).toBeVisible({ timeout: 60_000 });
  });
});
