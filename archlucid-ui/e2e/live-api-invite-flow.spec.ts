/**
 * Live invite admin flow (TB-795): settings UI sends invite → pending list → revoke.
 * Runs under DevelopmentBypass, ApiKey, and JWT CI jobs (`ui-e2e-live-apikey`, `ui-e2e-live-jwt`).
 */
import { expect, test } from "@playwright/test";

import { liveApiBase, resolveLiveJwtMode } from "./helpers/live-api-client";

test.describe("live-api-invite-flow", { tag: ["@founder"] }, () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    test.setTimeout(120_000);
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + auth.`,
      );
    }
  });

  test("admin invite round-trip: send invite, list pending, revoke", async ({ page }) => {
    test.setTimeout(180_000);

    if (resolveLiveJwtMode()) {
      const bearer = process.env.ARCHLUCID_PROXY_BEARER_TOKEN?.trim() ?? "";

      if (bearer.length === 0) {
        throw new Error(
          "JWT mode requires ARCHLUCID_PROXY_BEARER_TOKEN on the UI process so /api/proxy forwards Authorization.",
        );
      }
    }

    const inviteEmail = `e2e-invite-${Date.now()}@example.com`;

    await page.goto("/administration/users", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("settings-roles-page")).toBeVisible({ timeout: 60_000 });

    // Invite form lives in a closed <details> section (defaultOpen=false).
    const inviteSection = page.getByTestId("settings-roles-invite-section");
    await expect(inviteSection).toBeVisible({ timeout: 60_000 });
    await inviteSection.locator("summary").click();

    await expect(page.getByTestId("settings-roles-invite-form")).toBeVisible({ timeout: 60_000 });

    await page.getByTestId("settings-roles-invite-email").fill(inviteEmail);
    await page.getByTestId("settings-roles-invite-role").click();
    await page.getByRole("option", { name: /^Reader$/ }).click();
    await page.getByTestId("settings-roles-invite-submit").click();

    const pendingRow = page.locator("tr", { hasText: inviteEmail });
    await expect(pendingRow).toBeVisible({ timeout: 60_000 });
    await expect(pendingRow).toContainText("Pending");

    await pendingRow.getByRole("button", { name: "Revoke" }).click();

    const revokeDialog = page.getByRole("alertdialog");

    await expect(revokeDialog).toBeVisible({ timeout: 15_000 });
    await revokeDialog.getByRole("button", { name: "Revoke invitation" }).click();

    await expect(pendingRow).toContainText("Revoked", { timeout: 60_000 });
    await expect(pendingRow.getByRole("button", { name: "Revoke" })).toHaveCount(0);
  });
});
