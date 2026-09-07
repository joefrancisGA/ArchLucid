/**
 * SCIM-as-invite-substitute smoke (TB-797 wave 2): confirms SCIM admin surface loads under
 * JwtBearer and exposes the SCIM ↔ Users invite vocabulary rail (directory sync ≠ manual invite).
 */
import { expect, test } from "@playwright/test";

import { primeJwtBrowserSession, requireLivePrivateBetaJwtEnv } from "./helpers/live-private-beta-access";
import { resolveLiveJwtMode } from "./helpers/live-api-client";

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
});
