/**
 * SCIM-as-invite-substitute smoke (TB-797 wave 2+4): page load, vocabulary rail,
 * and admin token issue → list → revoke lifecycle under JwtBearer.
 */
import { expect, test, type APIResponse } from "@playwright/test";

import { clickControlThatOpensDialog } from "./helpers/dismiss-blocking-modal-overlays";
import {
  createScimAdminToken,
  primePrivateBetaBrowserPage,
  requireLivePrivateBetaJwtEnv,
} from "./helpers/live-private-beta-access";
import { injectDefaultTenantOperatorScope } from "./helpers/demo-workspace-live-scope";
import { waitAndDismissFirstSessionPurposeChooser } from "./helpers/live-seat-scope-assertions";
import { requireLiveScimAdminPreflight } from "./helpers/live-scim-admin-preflight";
import { liveApiBase, resolveLiveJwtMode } from "./helpers/live-api-client";
import { SCIM_CREATE_DIALOG_CONFIRM, SCIM_REVOKE_DIALOG_CONFIRM } from "@/lib/scim-provisioning-page-copy";

function expectSupportCorrelationId(response: APIResponse, context: string): void {
  expect(response.headers()["x-correlation-id"], `${context} should carry X-Correlation-ID`).toBeTruthy();
}

test.describe("live-api-scim-invite-substitute-smoke", { tag: ["@release-gate"] }, () => {
  test.skip(!resolveLiveJwtMode(), "Set LIVE_JWT_TOKEN to run SCIM invite-substitute smoke.");

  test.beforeAll(async ({ request }) => {
    await requireLiveScimAdminPreflight(request);
  });

  test("unauthenticated SCIM provisioning request is rejected", async ({ request }) => {
    const response = await request.get(`${liveApiBase}/scim/v2/Users`);

    expect([401, 403]).toContain(response.status());
    expectSupportCorrelationId(response, "unauthenticated SCIM response");
  });

  test("SCIM bearer cannot select a different tenant with x-tenant-id", async ({ request }) => {
    const { plaintextToken } = await createScimAdminToken(request);
    const response = await request.get(`${liveApiBase}/scim/v2/Users`, {
      headers: {
        Authorization: `Bearer ${plaintextToken}`,
        "x-tenant-id": "99999999-9999-9999-9999-999999999999",
        Accept: "application/scim+json",
      },
    });

    expect(response.status()).toBe(403);
    expectSupportCorrelationId(response, "cross-tenant SCIM response");
  });

  test("SCIM provisioning page loads vocabulary rail linking to Identity providers", async ({ page }) => {
    test.setTimeout(120_000);

    const { accessToken } = requireLivePrivateBetaJwtEnv();

    await primePrivateBetaBrowserPage(page, accessToken);
    await injectDefaultTenantOperatorScope(page);
    await page.goto("/administration/scim-provisioning", { waitUntil: "domcontentloaded" });
    if ((await page.getByText(/Something went wrong/i).count()) > 0) {
      await primePrivateBetaBrowserPage(page, accessToken);
      await injectDefaultTenantOperatorScope(page);
      await page.goto("/administration/scim-provisioning", { waitUntil: "domcontentloaded" });
    }

    await waitAndDismissFirstSessionPurposeChooser(page);
    await expect(page.getByTestId("scim-provisioning-settings-page")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("scim-identity-providers-vocabulary")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("scim-identity-providers-vocabulary-peer-link")).toBeVisible({
      timeout: 30_000,
    });
  });

  test("SCIM admin can issue, list, and revoke a provisioning token", async ({ page, request }) => {
    test.setTimeout(180_000);

    const { accessToken } = requireLivePrivateBetaJwtEnv();

    await primePrivateBetaBrowserPage(page, accessToken);
    await injectDefaultTenantOperatorScope(page);
    await page.goto("/administration/scim-provisioning", { waitUntil: "domcontentloaded" });
    if ((await page.getByText(/Something went wrong/i).count()) > 0) {
      await primePrivateBetaBrowserPage(page, accessToken);
      await injectDefaultTenantOperatorScope(page);
      await page.goto("/administration/scim-provisioning", { waitUntil: "domcontentloaded" });
    }

    await waitAndDismissFirstSessionPurposeChooser(page);
    await expect(page).toHaveURL(/\/administration\/scim-provisioning(?:[/?#]|$)/, { timeout: 30_000 });
    await expect(page.getByTestId("scim-provisioning-settings-page")).toBeVisible({ timeout: 60_000 });

    const existingDialog = page.getByRole("alertdialog");

    if (await existingDialog.isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await expect(existingDialog).toBeHidden({ timeout: 15_000 });
    }

    const createDialog = page.getByRole("alertdialog");

    try {
      await clickControlThatOpensDialog(page, page.getByTestId("scim-create-token"), createDialog);
    } catch (error) {
      const scimResponse = await request.get(`${liveApiBase}/v1/admin/scim/tokens`).catch(() => null);
      const scimStatus = scimResponse === null ? "unreachable" : String(scimResponse.status());
      throw new Error(
        `SCIM create-token control was not clickable at ${page.url()} (API GET /v1/admin/scim/tokens status=${scimStatus}). ${String(error)}`,
      );
    }

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
