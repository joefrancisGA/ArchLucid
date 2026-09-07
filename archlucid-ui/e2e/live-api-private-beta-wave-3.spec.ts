/**
 * Private-beta wave 3+: diagnostics smoke, sign-in recovery, deep-link returnUrl,
 * duplicate-invite idempotency, bootstrap UI accept path, email-OTP skip guard.
 */
import { expect, test } from "@playwright/test";

import {
  createAdminUserInvite,
  createScimAdminToken,
  primeJwtBrowserSession,
  provisionE2ePlatformUserPreAuth,
  provisionScimDirectoryUser,
  requireLivePrivateBetaJwtEnv,
  stubEmptyArchitectureDraftListRoute,
  clearJwtBrowserSession,
} from "./helpers/live-private-beta-access";
import { liveApiBase, liveJsonHeaders, resolveLiveJwtMode } from "./helpers/live-api-client";

const releaseGateTag = "@release-gate";

const deepLinkTargets = [
  { path: "/administration/users", fragment: "/administration/users" },
  { path: "/help/authentication-sign-in", fragment: "/help/authentication-sign-in" },
  { path: "/administration/scim-provisioning", fragment: "/administration/scim-provisioning" },
  {
    path: "/administration/identity-providers/diagnostics",
    fragment: "/administration/identity-providers/diagnostics",
  },
] as const;

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

    test("signed-out deep-link preserves returnUrl for admin and help destinations", async ({ browser }) => {
      test.setTimeout(180_000);

      const signedOutContext = await browser.newContext();
      const signedOutPage = await signedOutContext.newPage();

      try {
        for (const target of deepLinkTargets) {
          await stubEmptyArchitectureDraftListRoute(signedOutPage);
          await signedOutPage.goto(target.path, { waitUntil: "domcontentloaded" });

          await expect(signedOutPage).toHaveURL(/\/auth\/signin(\?|$)/, { timeout: 60_000 });

          const signInUrl = new URL(signedOutPage.url());
          const returnUrl = signInUrl.searchParams.get("returnUrl") ?? "";

          expect(decodeURIComponent(returnUrl)).toContain(target.fragment);
        }
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

    test("invitee walks /auth/bootstrap invitation accept in the browser (TB-927 UI)", async ({
      page,
      request,
    }) => {
      test.setTimeout(180_000);

      requireLivePrivateBetaJwtEnv();

      const inviteeEmail = `e2e-bootstrap-ui-${Date.now()}@example.com`;
      const invite = await createAdminUserInvite(request, inviteeEmail, { appRole: "Operator" });
      const preAuth = await provisionE2ePlatformUserPreAuth(request, inviteeEmail);

      await primeJwtBrowserSession(page, preAuth.preAuthAccessToken);
      await page.goto(`/auth/invite?token=${encodeURIComponent(invite.invitationToken)}`, {
        waitUntil: "domcontentloaded",
      });

      await page.goto("/auth/bootstrap", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("bootstrap-invitation-step")).toBeVisible({ timeout: 60_000 });

      await page.getByTestId(`bootstrap-accept-invitation-${invite.id}`).click();

      await expect(page).toHaveURL(/\/architecture\/first-review-guide\?source=invitation/, {
        timeout: 120_000,
      });
    });

    test("email-OTP invite path requires dedicated CI lane (skipped in jwt-bearer push)", async () => {
      test.skip(
        true,
        "Email-OTP invite E2E needs NEXT_PUBLIC_ARCHLUCID_EMAIL_OTP_ENABLED, Auth:EmailOtp:Enabled, and a challenge-code capture harness — not wired in private-beta-access-on-push.yml.",
      );
    });
  },
);
