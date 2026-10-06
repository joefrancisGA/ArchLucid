/**
 * Live invite admin flow (TB-795): settings UI sends invite → pending list → revoke.
 * Wave 4: duplicate pending UI idempotency + directory-user 409 surfacing.
 */
import { expect, test } from "@playwright/test";

import { submitAdminInviteFromUsersUi, gotoLiveAdminUsersInvitePage } from "./helpers/live-invite-form-submit";
import {
  createScimAdminToken,
  primePrivateBetaBrowserSessionIfJwtMode,
  provisionScimDirectoryUser,
  stubEmptyArchitectureDraftListRoute,
} from "./helpers/live-private-beta-access";
import { requireLiveScimAdminPreflight } from "./helpers/live-scim-admin-preflight";
import { clickThroughBlockingOverlays } from "./helpers/dismiss-blocking-modal-overlays";
import { liveApiBase, liveE2eAdminInviteUiPlaywrightTimeoutMs } from "./helpers/live-api-client";

test.describe("live-api-invite-flow", { tag: ["@founder", "@release-gate"] }, () => {
  test.describe.configure({ timeout: liveE2eAdminInviteUiPlaywrightTimeoutMs() });

  test.beforeEach(async ({ page }) => {
    await stubEmptyArchitectureDraftListRoute(page);
  });

  test.beforeAll(async ({ request }) => {
    test.setTimeout(120_000);
    const health = await request.get(`${liveApiBase}/health/ready`, { timeout: 60_000 });

    if (!health.ok()) {
      throw new Error(
        `Live API not ready at ${liveApiBase}/health/ready (status ${health.status()}). Start ArchLucid.Api with Sql + auth.`,
      );
    }
    await requireLiveScimAdminPreflight(request);
  });

  test("admin invite round-trip: send invite, list pending, revoke", async ({ page }) => {
    test.setTimeout(liveE2eAdminInviteUiPlaywrightTimeoutMs());

    const inviteEmail = `e2e-invite-${Date.now()}@example.com`;

    await primePrivateBetaBrowserSessionIfJwtMode(page);
    await gotoLiveAdminUsersInvitePage(page);
    await submitAdminInviteFromUsersUi(page, inviteEmail, "Reader");

    const invitationsTable = page.getByTestId("settings-roles-pending-invitations-table");
    const pendingRow = invitationsTable.locator("tr", { hasText: inviteEmail });
    await expect(pendingRow).toBeVisible({ timeout: 60_000 });
    await expect(pendingRow).toContainText("Pending");

    await expect(async () => {
      await pendingRow.scrollIntoViewIfNeeded();
      await clickThroughBlockingOverlays(page, pendingRow.getByRole("button", { name: "Revoke" }));
      await expect(page.getByRole("alertdialog")).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 90_000 });

    const revokeDialog = page.getByRole("alertdialog");
    await revokeDialog.getByRole("button", { name: "Revoke invitation" }).click();

    const revokedRow = invitationsTable.locator("tr", { hasText: inviteEmail });
    await expect(async () => {
      const showResolvedToggle = page.getByTestId("settings-roles-toggle-resolved-invitations");
      if (await showResolvedToggle.isVisible().catch(() => false)) {
        const toggleLabel = ((await showResolvedToggle.textContent()) ?? "").trim();
        if (/show resolved invitations/i.test(toggleLabel)) {
          await showResolvedToggle.click();
        }
      }

      await expect(revokedRow).toContainText("Revoked", { timeout: 5_000 });
    }).toPass({ timeout: 60_000 });

    await expect(revokedRow.getByRole("button", { name: "Revoke" })).toHaveCount(0);
  });

  test("duplicate pending invite from UI does not create a second row", async ({ page }) => {
    test.setTimeout(liveE2eAdminInviteUiPlaywrightTimeoutMs());

    const inviteEmail = `e2e-dup-ui-${Date.now()}@example.com`;

    await primePrivateBetaBrowserSessionIfJwtMode(page);
    await gotoLiveAdminUsersInvitePage(page);
    await submitAdminInviteFromUsersUi(page, inviteEmail, "Reader");

    const invitationsTable = page.getByTestId("settings-roles-pending-invitations-table");
    const pendingRow = invitationsTable.locator("tr", { hasText: inviteEmail });
    await expect(pendingRow).toBeVisible({ timeout: 60_000 });

    await gotoLiveAdminUsersInvitePage(page);
    await primePrivateBetaBrowserSessionIfJwtMode(page);
    await submitAdminInviteFromUsersUi(page, inviteEmail, "Reader");

    await expect(invitationsTable.locator("tr", { hasText: inviteEmail })).toHaveCount(1, { timeout: 60_000 });
  });

  test("invite to existing directory user surfaces conflict copy in UI", async ({ page, request }) => {
    test.setTimeout(liveE2eAdminInviteUiPlaywrightTimeoutMs());

    const directoryEmail = `e2e-dir-user-${Date.now()}@example.com`;
    const scimToken = await createScimAdminToken(request);

    await provisionScimDirectoryUser(request, directoryEmail, scimToken.plaintextToken);

    await primePrivateBetaBrowserSessionIfJwtMode(page);
    await gotoLiveAdminUsersInvitePage(page);
    await submitAdminInviteFromUsersUi(page, directoryEmail, "Reader");

    await expect(page.getByText(/Cannot invite this email|directory user already exists/i)).toBeVisible({
      timeout: 60_000,
    });
  });
});
