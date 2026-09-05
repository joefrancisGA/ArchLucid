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
  clearJwtBrowserSession,
  createAdminUserInvite,
  fetchAuthMeViaProxy,
  listPendingInvitations,
  provisionE2ePlatformUserPreAuth,
  readRoleClaims,
  stubEmptyArchitectureDraftListRoute,
  validateInvitationToken,
  LIVE_E2E_DEFAULT_PROJECT_ID,
  LIVE_E2E_DEFAULT_TENANT_ID,
  LIVE_E2E_DEFAULT_WORKSPACE_ID,
  primeJwtBrowserSession,
  requireLivePrivateBetaJwtEnv,
  resolveScopeFromAuthMe,
  writeJwtBrowserSession,
} from "./helpers/live-private-beta-access";
import { expectLiveRunDetailPageReady } from "./helpers/operator-journey";
import { expectLiveReviewsHubListReady } from "./helpers/live-page-readiness";
import { RUNS_LIST_PAGE_PRIMARY_HEADING_PATTERN } from "./fixtures";
import {
  createRun,
  enrichArchitectureRequestBody,
  liveApiBase,
  liveE2eArchitectureDescription,
  liveE2ePrivateBetaAccessPlaywrightTimeoutMs,
  resolveLiveJwtMode,
  toRunGuidPathSegment,
  liveJsonHeaders,
  waitForArchitectureRunListIncludesRun,
  waitForLiveApiReady,
} from "./helpers/live-api-client";

const expectedScope = {
  tenantId: LIVE_E2E_DEFAULT_TENANT_ID,
  workspaceId: LIVE_E2E_DEFAULT_WORKSPACE_ID,
  projectId: LIVE_E2E_DEFAULT_PROJECT_ID,
};

test.describe("live-api-private-beta-access", () => {
  test.skip(!resolveLiveJwtMode(), "Set LIVE_JWT_TOKEN to run private-beta JwtBearer access-path smoke.");

  test.beforeAll(async ({ request }) => {
    await waitForLiveApiReady(request);

    requireLivePrivateBetaJwtEnv();

    // CI stubs draft inventory in-browser; cold SQL can hang direct API draft-list for minutes.
    if (process.env.LIVE_E2E_PRIVATE_BETA_ACCESS === "1") {
      return;
    }

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

    await stubEmptyArchitectureDraftListRoute(page);
    await primeJwtBrowserSession(page, accessToken);
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

    await writeJwtBrowserSession(page, accessToken);
    await page.goto(reviewPath, { waitUntil: "domcontentloaded" });
    await expectLiveRunDetailPageReady(page, 120_000);

    const signedOutContext = await browser.newContext();
    const signedOutPage = await signedOutContext.newPage();

    try {
      await signedOutPage.goto(reviewPath, { waitUntil: "domcontentloaded" });

      await expect(signedOutPage).toHaveURL(/\/auth\/signin(\?|$)/, { timeout: 60_000 });

      const signInUrl = new URL(signedOutPage.url());
      const returnUrl = signInUrl.searchParams.get("returnUrl") ?? "";

      expect(decodeURIComponent(returnUrl)).toContain(toRunGuidPathSegment(runId));

      await writeJwtBrowserSession(signedOutPage, accessToken);
      await signedOutPage.goto(reviewPath, { waitUntil: "domcontentloaded" });
      await expectLiveRunDetailPageReady(signedOutPage, 120_000);
    } finally {
      await signedOutContext.close();
    }

    test.info().annotations.push({ type: "e2e-beta-access-run-id", description: runId });
    test.info().annotations.push({ type: "e2e-beta-access-invite-id", description: invite.id });
  });

  test("invitee Operator accept → session → create review under invitee principal (TB-927)", async ({
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

    await stubEmptyArchitectureDraftListRoute(page);
    await primeJwtBrowserSession(page, inviteeSession.accessToken);
    await page.goto(inviteeSession.redirectPath, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/architecture\/first-review-guide\?source=invitation/);

    const me = await fetchAuthMeViaProxy(page, inviteeSession.accessToken);
    const scope = resolveScopeFromAuthMe(me, expectedScope);
    const roles = readRoleClaims(me.claims);

    expect(scope.tenantId.toLowerCase()).toBe(expectedScope.tenantId.toLowerCase());
    expect(scope.workspaceId.toLowerCase()).toBe(expectedScope.workspaceId.toLowerCase());
    expect(scope.projectId.toLowerCase()).toBe(expectedScope.projectId.toLowerCase());
    expect(roles.map((role) => role.toLowerCase())).toContain("operator");

    const { runId } = await createRun(
      request,
      enrichArchitectureRequestBody({
        requestId: `E2E-BETA-INVITEE-${Date.now()}`,
        description: liveE2eArchitectureDescription("Private beta invitee first meaningful action."),
        systemName: "PrivateBetaInviteeSmoke",
        environment: "prod",
        cloudProvider: 1,
        constraints: [] as string[],
        requiredCapabilities: ["SQL"],
        assumptions: [] as string[],
        priorManifestVersion: null as string | null,
      }),
      scope,
      inviteeSession.accessToken,
    );

    await waitForArchitectureRunListIncludesRun(
      request,
      runId,
      120_000,
      scope,
      inviteeSession.accessToken,
    );

    await page.goto("/architecture/reviews/new", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: START_REVIEW_LABEL, level: 1 })).toBeVisible({
      timeout: 60_000,
    });

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
});
