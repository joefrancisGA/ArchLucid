/**
 * Private-beta access-path canonical smoke (TB-797): JwtBearer invite → signed-in session →
 * tenant scope via `/me` → first review action → session-expiry recovery → signed-out deep-link
 * round-trip (TB-796). CI uses minted JWT sessionStorage injection instead of a live IdP redirect.
 *
 * Job: `ui-e2e-live-beta-access` (merge-blocking; requires `NEXT_PUBLIC_ARCHLUCID_AUTH_MODE=jwt-bearer` build).
 */
import { expect, test } from "@playwright/test";

import { START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";

import {
  acceptInvitationAsPlatformUser,
  assertJwtScopeBindingRejectsForgedTenantHeader,
  assertNonAdminCannotInvite,
  clearJwtBrowserSession,
  createAdminUserInvite,
  expireAdminUserInvitation,
  fetchAuthMeViaProxy,
  fetchAuthMeWithBearer,
  listPendingInvitations,
  provisionE2ePlatformUserPreAuth,
  readRoleClaims,
  revokeAdminUserInvite,
  stubEmptyArchitectureDraftListRoute,
  validateInvitationToken,
  LIVE_E2E_DEFAULT_PROJECT_ID,
  LIVE_E2E_DEFAULT_TENANT_ID,
  LIVE_E2E_DEFAULT_WORKSPACE_ID,
  primePrivateBetaBrowserPage,
  requireLivePrivateBetaJwtEnv,
  resolveScopeFromAuthMe,
  writeJwtBrowserSession,
} from "./helpers/live-private-beta-access";
import { expectLiveRunDetailPageReady } from "./helpers/operator-journey";
import { submitPrivateBetaSimplifiedPilotWizard } from "./helpers/private-beta-simplified-pilot-wizard";
import { expectLiveReviewsHubListReady } from "./helpers/live-page-readiness";
import { RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN } from "./fixtures";
import {
  createRun,
  enrichArchitectureRequestBody,
  getRunDetailsWithTransientRetries,
  liveApiBase,
  liveE2eArchitectureDescription,
  liveE2ePrivateBetaAccessPlaywrightTimeoutMs,
  resolveArchitectureIdentityIdForRun,
  resolveLiveJwtMode,
  toRunGuidPathSegment,
  liveJsonHeaders,
  waitForArchitectureRunListIncludesRun,
  waitForLiveApiReady,
  warmPrivateBetaCreateRunPipeline,
} from "./helpers/live-api-client";

const expectedScope = {
  tenantId: LIVE_E2E_DEFAULT_TENANT_ID,
  workspaceId: LIVE_E2E_DEFAULT_WORKSPACE_ID,
  projectId: LIVE_E2E_DEFAULT_PROJECT_ID,
};

const releaseGateTag = "@release-gate";

test.describe(
  `live-api-private-beta-access (${releaseGateTag})`,
  { tag: [releaseGateTag, "@critical", "@buyer-journey"] },
  () => {
  test.skip(!resolveLiveJwtMode(), "Set LIVE_JWT_TOKEN to run private-beta JwtBearer access-path smoke.");

  test.beforeAll(async ({ request }) => {
    await waitForLiveApiReady(request, {
      timeoutMs: process.env.LIVE_E2E_PRIVATE_BETA_ACCESS === "1" ? 180_000 : undefined,
    });

    requireLivePrivateBetaJwtEnv();

    if (process.env.LIVE_E2E_PRIVATE_BETA_ACCESS === "1") {
      await warmPrivateBetaCreateRunPipeline(request, expectedScope);

      return;
    }

    // CI stubs draft inventory in-browser; cold SQL can hang direct API draft-list for minutes.

    const draftListRes = await request.get(
      `${liveApiBase}/v1/architecture/draft?mine=true&page=1&pageSize=1`,
      { headers: liveJsonHeaders(), timeout: 120_000 },
    );

    if (!draftListRes.ok()) {
      const body = await draftListRes.text();

      throw new Error(
        `GET /v1/architecture/draft warm-up failed ${draftListRes.status()}: ${body.slice(0, 400)}`,
      );
    }
  });

    test("JwtBearer rejects forged x-tenant-id on scope and invitations (TB-925)", async ({ request }) => {
    requireLivePrivateBetaJwtEnv();

    await assertJwtScopeBindingRejectsForgedTenantHeader(request);
  });

    test("signed-in /403 access-denied surfaces recovery CTAs (missing role / wrong tenant)", async ({ page }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    const { accessToken } = requireLivePrivateBetaJwtEnv();

    await primePrivateBetaBrowserPage(page, accessToken);
    await page.goto("/403", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("operator-access-denied-heading")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("operator-access-denied-return-sign-in")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("operator-access-denied-use-different-account")).toBeVisible({ timeout: 30_000 });
    });

    test("signed-in /me 403 surfaces wrong-tenant supplement and Report Problem", async ({ page }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    const { accessToken } = requireLivePrivateBetaJwtEnv();

    await primePrivateBetaBrowserPage(page, accessToken);
    await page.route("**/api/proxy/api/auth/me**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();

        return;
      }

      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: "{}",
      });
    });

    await page.goto("/403", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("operator-access-denied-supplement")).toContainText(
      "not authorized for the selected tenant",
      { timeout: 30_000 },
    );
    await expect(page.getByTestId("fatal-page-report-problem-row")).toBeVisible({ timeout: 30_000 });
    });

    test("signed-in /me 200 without roles surfaces missing-role supplement", async ({ page }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    const { accessToken } = requireLivePrivateBetaJwtEnv();

    await primePrivateBetaBrowserPage(page, accessToken);
    await page.route("**/api/proxy/api/auth/me**", async (route) => {
      if (route.request().method() !== "GET") {
        await route.continue();

        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          name: "e2e-no-role",
          claims: [
            { type: "tenant_id", value: LIVE_E2E_DEFAULT_TENANT_ID },
            { type: "workspace_id", value: LIVE_E2E_DEFAULT_WORKSPACE_ID },
            { type: "project_id", value: LIVE_E2E_DEFAULT_PROJECT_ID },
          ],
        }),
      });
    });

    await page.goto("/403", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("operator-access-denied-supplement")).toContainText(
      "No ArchLucid app role was found",
      { timeout: 30_000 },
    );
    await expect(page.getByTestId("fatal-page-report-problem-row")).toBeVisible({ timeout: 30_000 });
    });

    test("expired invitation token surfaces recovery copy and Report Problem on /auth/invite", async ({
      page,
      request,
    }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    requireLivePrivateBetaJwtEnv();

    const inviteEmail = `e2e-beta-expired-${Date.now()}@example.com`;
    const invite = await createAdminUserInvite(request, inviteEmail);

    await expireAdminUserInvitation(request, invite.id);

    const validation = await validateInvitationToken(request, invite.invitationToken);

    expect(validation.status).toBe("Expired");

    await page.goto(`/auth/invite?token=${encodeURIComponent(invite.invitationToken)}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("invitation-invalid-alert")).toContainText("expired", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("fatal-page-report-problem-row")).toBeVisible({ timeout: 30_000 });
    });

    test("already-accepted invitation surfaces recovery copy on /auth/invite", async ({ page, request }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    requireLivePrivateBetaJwtEnv();

    const inviteeEmail = `e2e-beta-accepted-${Date.now()}@example.com`;
    const invite = await createAdminUserInvite(request, inviteeEmail, { appRole: "Reader" });
    const preAuth = await provisionE2ePlatformUserPreAuth(request, inviteeEmail);

    await acceptInvitationAsPlatformUser(
      request,
      preAuth.preAuthAccessToken,
      invite.id,
      invite.invitationToken,
    );

    const validation = await validateInvitationToken(request, invite.invitationToken);

    expect(validation.status).toBe("Accepted");

    await page.goto(`/auth/invite?token=${encodeURIComponent(invite.invitationToken)}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("invitation-invalid-alert")).toContainText("already been used", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("fatal-page-report-problem-row")).toBeVisible({ timeout: 30_000 });
    });

    test("non-admin principal cannot POST /v1/admin/users/invite (403)", async ({ request }) => {
    requireLivePrivateBetaJwtEnv();

    const inviteeEmail = `e2e-beta-nonadmin-${Date.now()}@example.com`;
    const preAuth = await provisionE2ePlatformUserPreAuth(request, inviteeEmail);

    await assertNonAdminCannotInvite(request, preAuth.preAuthAccessToken, `blocked-${Date.now()}@example.com`);
    });

    test("OIDC callback failure surfaces access panel and Report Problem", async ({ page }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    await page.goto("/auth/callback?error=access_denied&error_description=e2e-callback-failure", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("auth-callback-access-panel")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("fatal-page-report-problem-row")).toBeVisible({ timeout: 30_000 });
    });

    test("revoked invitation token surfaces recovery copy and Report Problem on /auth/invite", async ({
      page,
      request,
    }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    requireLivePrivateBetaJwtEnv();

    const inviteEmail = `e2e-beta-revoked-${Date.now()}@example.com`;
    const invite = await createAdminUserInvite(request, inviteEmail);

    await revokeAdminUserInvite(request, invite.id);

    const validation = await validateInvitationToken(request, invite.invitationToken);

    expect(validation.status).toBe("Revoked");

    await page.goto(`/auth/invite?token=${encodeURIComponent(invite.invitationToken)}`, {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("invitation-invalid-alert")).toContainText("no longer active", {
      timeout: 30_000,
    });
    await expect(page.getByTestId("fatal-page-report-problem-row")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("invitation-recovery-sign-in")).toBeVisible({ timeout: 30_000 });
    });

  test.describe("browser journeys", () => {
    test.describe.configure({ mode: "serial" });

    test.beforeEach(async ({ page }) => {
      await stubEmptyArchitectureDraftListRoute(page);
    });

    test("invite → auth session → tenant scope → review → expiry recovery → deep-link round-trip", async ({
      page,
      request,
      browser,
    }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    const { accessToken } = requireLivePrivateBetaJwtEnv();

    const inviteEmail = `e2e-beta-access-${Date.now()}@example.com`;
    const invite = await createAdminUserInvite(request, inviteEmail);

    expect(invite.email).toBe(inviteEmail);

    const validation = await validateInvitationToken(request, invite.invitationToken);

    expect(validation.status).toBe("Valid");
    expect(validation.appRole).toBe("Reader");
    expect(validation.maskedInvitedEmail?.length ?? 0).toBeGreaterThan(0);

    const invitations = await listPendingInvitations(request);
    const pendingMatch = invitations.some(
      (row) =>
        typeof row === "object" &&
        row !== null &&
        (row as { email?: string }).email?.toLowerCase() === inviteEmail.toLowerCase(),
    );

    expect(pendingMatch).toBe(true);

    await primePrivateBetaBrowserPage(page, accessToken);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const me = await fetchAuthMeViaProxy(page);
    const scope = resolveScopeFromAuthMe(me, expectedScope);

    expect(scope.tenantId.toLowerCase()).toBe(expectedScope.tenantId.toLowerCase());
    expect(scope.workspaceId.toLowerCase()).toBe(expectedScope.workspaceId.toLowerCase());
    expect(scope.projectId.toLowerCase()).toBe(expectedScope.projectId.toLowerCase());

    const { runId } = await createRun(
      request,
      enrichArchitectureRequestBody({
        requestId: `E2E-BETA-ACCESS-${Date.now()}`,
        description: liveE2eArchitectureDescription("Private beta access-path smoke architecture review."),
        systemName: "PrivateBetaAccessSmoke",
        environment: "prod",
        cloudProvider: 1,
        constraints: [] as string[],
        requiredCapabilities: ["SQL"],
        assumptions: [] as string[],
        priorManifestVersion: null as string | null,
      }),
      scope,
    );

    await waitForArchitectureRunListIncludesRun(request, runId, 120_000, scope);

    const runDetail = await getRunDetailsWithTransientRetries(request, runId, scope);
    const architectureId = (await resolveArchitectureIdentityIdForRun(request, runId, runDetail, scope)) ?? "";

    if (architectureId.length > 0) {
      await page.goto(`/architecture/architectures/${encodeURIComponent(architectureId)}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByTestId("architecture-identity-desk")).toBeVisible({ timeout: 90_000 });
    }

    await page.goto("/architecture/reviews/new", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: START_REVIEW_LABEL, level: 1 })).toBeVisible({
      timeout: 60_000,
    });

    const reviewPath = `/architecture/reviews/${encodeURIComponent(toRunGuidPathSegment(runId))}`;

    await page.goto(`/architecture/reviews?projectId=${encodeURIComponent(scope.projectId)}`, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible({ timeout: 90_000 });
    await expectLiveReviewsHubListReady(page, { timeoutMs: 90_000, projectId: scope.projectId });
    const reviewsHubRow = page.locator(
      `[data-testid="reviews-hub-row-${runId}"], [data-testid="reviews-hub-row-${toRunGuidPathSegment(runId)}"]`,
    );
    await expect(reviewsHubRow.first()).toBeVisible({ timeout: 90_000 });

    await page.goto(reviewPath, { waitUntil: "domcontentloaded" });
    await expectLiveRunDetailPageReady(page, 120_000);

    await clearJwtBrowserSession(page);
    const sessionExpiredHref = `/auth/session-expired?reason=idle-timeout&returnUrl=${encodeURIComponent(reviewPath)}`;

    await page.goto(sessionExpiredHref, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("session-expired-heading")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("fatal-page-report-problem-row")).toBeVisible({ timeout: 30_000 });

    await writeJwtBrowserSession(page, accessToken);
    await page.goto(reviewPath, { waitUntil: "domcontentloaded" });
    await expectLiveRunDetailPageReady(page, 120_000);

    const signedOutContext = await browser.newContext();
    const signedOutPage = await signedOutContext.newPage();

    try {
      await stubEmptyArchitectureDraftListRoute(signedOutPage);
      await signedOutPage.goto(reviewPath, { waitUntil: "domcontentloaded" });

      await expect(signedOutPage).toHaveURL(/\/auth\/signin(\?|$)/, { timeout: 60_000 });

      const signInUrl = new URL(signedOutPage.url());
      const returnUrl = signInUrl.searchParams.get("returnUrl") ?? "";

      expect(decodeURIComponent(returnUrl)).toContain(toRunGuidPathSegment(runId));

      await writeJwtBrowserSession(signedOutPage, accessToken);
      await signedOutPage.goto(reviewPath, { waitUntil: "domcontentloaded" });
      await expectLiveRunDetailPageReady(signedOutPage, 120_000);

      await clearJwtBrowserSession(signedOutPage);
      await stubEmptyArchitectureDraftListRoute(signedOutPage);
      await signedOutPage.goto("/architecture/reviews/new", { waitUntil: "domcontentloaded" });

      await expect(signedOutPage).toHaveURL(/\/auth\/signin(\?|$)/, { timeout: 60_000 });

      const startReviewSignInUrl = new URL(signedOutPage.url());
      const startReviewReturnUrl = startReviewSignInUrl.searchParams.get("returnUrl") ?? "";

      expect(decodeURIComponent(startReviewReturnUrl)).toContain("/architecture/reviews/new");

      await clearJwtBrowserSession(signedOutPage);
      await stubEmptyArchitectureDraftListRoute(signedOutPage);
      await signedOutPage.goto("/architecture/first-review-guide", { waitUntil: "domcontentloaded" });

      await expect(signedOutPage).toHaveURL(/\/auth\/signin(\?|$)/, { timeout: 60_000 });

      const guideSignInUrl = new URL(signedOutPage.url());
      const guideReturnUrl = guideSignInUrl.searchParams.get("returnUrl") ?? "";

      expect(decodeURIComponent(guideReturnUrl)).toContain("/architecture/first-review-guide");
    } finally {
      await signedOutContext.close();
    }

    test.info().annotations.push({ type: "e2e-beta-access-run-id", description: runId });
    test.info().annotations.push({ type: "e2e-beta-access-invite-id", description: invite.id });
    });

    test("invitee Operator accept → session → UI wizard create review under invitee principal (TB-927)", async ({
      page,
      request,
    }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    requireLivePrivateBetaJwtEnv();

    const inviteeEmail = `e2e-beta-invitee-${Date.now()}@example.com`;
    const invite = await createAdminUserInvite(request, inviteeEmail, { appRole: "Operator" });

    const validation = await validateInvitationToken(request, invite.invitationToken);

    expect(validation.status).toBe("Valid");
    expect(validation.appRole).toBe("Operator");

    const preAuth = await provisionE2ePlatformUserPreAuth(request, inviteeEmail);
    const inviteeSession = await acceptInvitationAsPlatformUser(
      request,
      preAuth.preAuthAccessToken,
      invite.id,
      invite.invitationToken,
    );

    expect(inviteeSession.redirectPath).toBe("/architecture/first-review-guide?source=invitation");

    await primePrivateBetaBrowserPage(page, inviteeSession.accessToken);
    await page.goto(inviteeSession.redirectPath, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/architecture\/first-review-guide\?source=invitation/);

    const meDirect = await fetchAuthMeWithBearer(request, inviteeSession.accessToken);
    const directRoles = readRoleClaims(meDirect.claims);

    expect(directRoles.map((role) => role.toLowerCase())).toContain("operator");

    const me = await fetchAuthMeViaProxy(page, inviteeSession.accessToken);
    const scope = resolveScopeFromAuthMe(me, expectedScope);
    const roles = readRoleClaims(me.claims);

    expect(scope.tenantId.toLowerCase()).toBe(expectedScope.tenantId.toLowerCase());
    expect(scope.workspaceId.toLowerCase()).toBe(expectedScope.workspaceId.toLowerCase());
    expect(scope.projectId.toLowerCase()).toBe(expectedScope.projectId.toLowerCase());
    expect(roles.map((role) => role.toLowerCase())).toContain("operator");

    const runId = await submitPrivateBetaSimplifiedPilotWizard(page);

    await waitForArchitectureRunListIncludesRun(
      request,
      runId,
      120_000,
      scope,
      inviteeSession.accessToken,
    );

    const reviewPath = `/architecture/reviews/${encodeURIComponent(toRunGuidPathSegment(runId))}`;

    // Buyer-polished hub rows expose `reviews-hub-row-{runId}` — link accessible names are titles, not GUID prefixes.
    await page.goto(`/architecture/reviews?projectId=${encodeURIComponent(scope.projectId)}`, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { level: 2, name: RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN }),
    ).toBeVisible({ timeout: 90_000 });
    await expectLiveReviewsHubListReady(page, { timeoutMs: 90_000, projectId: scope.projectId });
    const reviewsHubRow = page.locator(
      `[data-testid="reviews-hub-row-${runId}"], [data-testid="reviews-hub-row-${toRunGuidPathSegment(runId)}"]`,
    );
    await expect(reviewsHubRow.first()).toBeVisible({ timeout: 90_000 });

    await page.goto(reviewPath, { waitUntil: "domcontentloaded" });
    await expectLiveRunDetailPageReady(page, 120_000);

    test.info().annotations.push({ type: "e2e-beta-invitee-run-id", description: runId });
    test.info().annotations.push({ type: "e2e-beta-invitee-platform-user-id", description: preAuth.platformUserId });
    });

    test("Reader invitee accept → first-review-guide under invitee principal (TB-927)", async ({
      page,
      request,
    }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    requireLivePrivateBetaJwtEnv();

    const inviteeEmail = `e2e-beta-reader-${Date.now()}@example.com`;
    const invite = await createAdminUserInvite(request, inviteeEmail, { appRole: "Reader" });

    const validation = await validateInvitationToken(request, invite.invitationToken);

    expect(validation.status).toBe("Valid");
    expect(validation.appRole).toBe("Reader");

    const preAuth = await provisionE2ePlatformUserPreAuth(request, inviteeEmail);
    const inviteeSession = await acceptInvitationAsPlatformUser(
      request,
      preAuth.preAuthAccessToken,
      invite.id,
      invite.invitationToken,
    );

    expect(inviteeSession.redirectPath).toBe("/architecture/first-review-guide?source=invitation");

    await primePrivateBetaBrowserPage(page, inviteeSession.accessToken);
    await page.goto(inviteeSession.redirectPath, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/architecture\/first-review-guide\?source=invitation/);

    const meDirect = await fetchAuthMeWithBearer(request, inviteeSession.accessToken);
    const directRoles = readRoleClaims(meDirect.claims);

    expect(directRoles.map((role) => role.toLowerCase())).toContain("reader");

    const me = await fetchAuthMeViaProxy(page, inviteeSession.accessToken);
    const roles = readRoleClaims(me.claims);

    expect(roles.map((role) => role.toLowerCase())).toContain("reader");

    test.info().annotations.push({
      type: "e2e-beta-reader-platform-user-id",
      description: preAuth.platformUserId,
    });
    });

    test("Auditor invitee accept → first-review-guide under invitee principal (TB-927)", async ({
      page,
      request,
    }) => {
    test.setTimeout(liveE2ePrivateBetaAccessPlaywrightTimeoutMs());

    requireLivePrivateBetaJwtEnv();

    const inviteeEmail = `e2e-beta-auditor-${Date.now()}@example.com`;
    const invite = await createAdminUserInvite(request, inviteeEmail, { appRole: "Auditor" });

    const validation = await validateInvitationToken(request, invite.invitationToken);

    expect(validation.status).toBe("Valid");
    expect(validation.appRole).toBe("Auditor");

    const preAuth = await provisionE2ePlatformUserPreAuth(request, inviteeEmail);
    const inviteeSession = await acceptInvitationAsPlatformUser(
      request,
      preAuth.preAuthAccessToken,
      invite.id,
      invite.invitationToken,
    );

    expect(inviteeSession.redirectPath).toBe("/architecture/first-review-guide?source=invitation");

    await primePrivateBetaBrowserPage(page, inviteeSession.accessToken);
    await page.goto(inviteeSession.redirectPath, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/architecture\/first-review-guide\?source=invitation/);

    const meDirect = await fetchAuthMeWithBearer(request, inviteeSession.accessToken);
    const directRoles = readRoleClaims(meDirect.claims);

    expect(directRoles.map((role) => role.toLowerCase())).toContain("auditor");

    const me = await fetchAuthMeViaProxy(page, inviteeSession.accessToken);
    const roles = readRoleClaims(me.claims);

    expect(roles.map((role) => role.toLowerCase())).toContain("auditor");

    test.info().annotations.push({
      type: "e2e-beta-auditor-platform-user-id",
      description: preAuth.platformUserId,
    });
    });
  });
});
