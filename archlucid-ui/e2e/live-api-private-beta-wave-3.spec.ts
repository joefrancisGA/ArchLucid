/**
 * Private-beta wave 3: diagnostics smoke, sign-in recovery, deep-link returnUrl, duplicate-invite idempotency.
 */
import { expect, test } from "@playwright/test";

import {
  createAdminUserInvite,
  primeJwtBrowserSession,
  requireLivePrivateBetaJwtEnv,
  stubEmptyArchitectureDraftListRoute,
  clearJwtBrowserSession,
} from "./helpers/live-private-beta-access";
import { liveApiBase, liveJsonHeaders, resolveLiveJwtMode } from "./helpers/live-api-client";

const releaseGateTag = "@release-gate";

test.describe(
  `live-api-private-beta-wave-3 (${releaseGateTag})`,
  { tag: [releaseGateTag, "@critical"] },
  () => {
    test.skip(!resolveLiveJwtMode(), "Set LIVE_JWT_TOKEN to run private-beta wave-3 smoke.");

    test("identity diagnostics page loads under JwtBearer (TB-928)", async ({ page, request }) => {
      test.setTimeout(120_000);

      const { accessToken } = requireLivePrivateBetaJwtEnv();

      const diagnosticsRes = await request.get(`${liveApiBase}/v1/admin/auth/configuration-diagnostics`, {
        headers: liveJsonHeaders(),
      });

      expect(diagnosticsRes.ok()).toBe(true);

      const diagnostics = (await diagnosticsRes.json()) as {
        operatorBaseUrlConfigured?: boolean;
        localTrialIdentityConfigured?: boolean;
      };

      expect(diagnostics.operatorBaseUrlConfigured).toBe(true);
      expect(diagnostics.localTrialIdentityConfigured).toBe(true);

      await primeJwtBrowserSession(page, accessToken);
      await page.goto("/administration/identity-providers/diagnostics", { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("identity-providers-settings-shell")).toBeVisible({ timeout: 60_000 });
      await expect(page.getByTestId("identity-providers-diagnostics-primary-lead")).toBeVisible({
        timeout: 60_000,
      });
    });

    test("signed-out /auth/signin exposes Report Problem when no sign-in methods are configured", async ({
      page,
    }) => {
      test.setTimeout(90_000);

      await clearJwtBrowserSession(page);
      await stubEmptyArchitectureDraftListRoute(page);
      await page.goto("/auth/signin?returnUrl=%2Farchitecture%2Freviews", { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("fatal-page-report-problem-row")).toBeVisible({ timeout: 60_000 });
    });

    test("signed-out deep-link preserves returnUrl for administration users and help topics", async ({
      browser,
    }) => {
      test.setTimeout(120_000);

      const signedOutContext = await browser.newContext();
      const signedOutPage = await signedOutContext.newPage();

      try {
        await stubEmptyArchitectureDraftListRoute(signedOutPage);

        await signedOutPage.goto("/administration/users", { waitUntil: "domcontentloaded" });

        await expect(signedOutPage).toHaveURL(/\/auth\/signin(\?|$)/, { timeout: 60_000 });

        const usersSignInUrl = new URL(signedOutPage.url());
        const usersReturnUrl = usersSignInUrl.searchParams.get("returnUrl") ?? "";

        expect(decodeURIComponent(usersReturnUrl)).toContain("/administration/users");

        await stubEmptyArchitectureDraftListRoute(signedOutPage);
        await signedOutPage.goto("/help/authentication-sign-in", { waitUntil: "domcontentloaded" });

        await expect(signedOutPage).toHaveURL(/\/auth\/signin(\?|$)/, { timeout: 60_000 });

        const helpSignInUrl = new URL(signedOutPage.url());
        const helpReturnUrl = helpSignInUrl.searchParams.get("returnUrl") ?? "";

        expect(decodeURIComponent(helpReturnUrl)).toContain("/help/authentication-sign-in");
      } finally {
        await signedOutContext.close();
      }
    });

    test("duplicate pending invite to the same email is idempotent (200, same id)", async ({ request }) => {
      test.setTimeout(60_000);

      requireLivePrivateBetaJwtEnv();

      const inviteEmail = `e2e-dup-invite-${Date.now()}@example.com`;
      const firstInvite = await createAdminUserInvite(request, inviteEmail, { appRole: "Reader" });
      const secondInvite = await createAdminUserInvite(request, inviteEmail, { appRole: "Reader" });

      expect(secondInvite.id).toBe(firstInvite.id);
      expect(secondInvite.email).toBe(firstInvite.email);
    });
  },
);
