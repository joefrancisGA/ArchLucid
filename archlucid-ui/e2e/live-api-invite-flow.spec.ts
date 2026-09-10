/**
 * Live invite admin flow (TB-795): settings UI sends invite → pending list → revoke.
 * Wave 4: duplicate pending UI idempotency + directory-user 409 surfacing.
 */
import { expect, test } from "@playwright/test";

import {
  createScimAdminToken,
  primePrivateBetaBrowserSessionIfJwtMode,
  provisionScimDirectoryUser,
  submitAdminInviteFromUsersUi,
} from "./helpers/live-private-beta-access";
import { liveApiBase } from "./helpers/live-api-client";

async function gotoUsersInvitePage(page: import("@playwright/test").Page): Promise<void> {
  await primePrivateBetaBrowserSessionIfJwtMode(page);
  await page.goto("/administration/users", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("settings-roles-page")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId("settings-roles-tabpanel-users")).toBeVisible({ timeout: 60_000 });
}

test.describe("live-api-invite-flow", { tag: ["@founder", "@release-gate"] }, () => {
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

    const inviteEmail = `e2e-invite-${Date.now()}@example.com`;

    await gotoUsersInvitePage(page);
    await submitAdminInviteFromUsersUi(page, inviteEmail, "Reader");

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

  test("duplicate pending invite from UI does not create a second row", async ({ page }) => {
    test.setTimeout(180_000);

    const inviteEmail = `e2e-dup-ui-${Date.now()}@example.com`;

    await gotoUsersInvitePage(page);
    await submitAdminInviteFromUsersUi(page, inviteEmail, "Reader");

    const pendingRow = page.locator("tr", { hasText: inviteEmail });
    await expect(pendingRow).toBeVisible({ timeout: 60_000 });

    await submitAdminInviteFromUsersUi(page, inviteEmail, "Reader");

    await expect(page.locator("tr", { hasText: inviteEmail })).toHaveCount(1, { timeout: 60_000 });
  });

  test("invite to existing directory user surfaces conflict copy in UI", async ({ page, request }) => {
    test.setTimeout(180_000);

    const directoryEmail = `e2e-dir-user-${Date.now()}@example.com`;
    const scimToken = await createScimAdminToken(request);

    await provisionScimDirectoryUser(request, directoryEmail, scimToken.plaintextToken);

    await gotoUsersInvitePage(page);
    await submitAdminInviteFromUsersUi(page, directoryEmail, "Reader");

    await expect(page.getByText(/Cannot invite this email|directory user already exists/i)).toBeVisible({
      timeout: 60_000,
    });
  });
});
