/**
 * Seeds browser operator scope (`archlucid_operator_scope_v1`) for SQL-backed demo workspace runs — see `docs/go-to-market/DEMO_WORKSPACES.md`.
 * Stable GUIDs are pinned in `fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json` (Playwright + CI parity).
 */
import type { Page } from "@playwright/test";

import {
  OPERATOR_SCOPE_COOKIE_NAME,
  serializeOperatorScopeCookiePayload,
} from "@/lib/operator/operator-scope-cookie";
import { OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY } from "@/lib/operator/operator-sample-workspace-visit";
import { E2E_LS010_BOOTSTRAP_REDIRECT_SUPPRESS_STORAGE_KEY } from "@/lib/operator/e2e-live-seat-ls010-bypass";

import { demoWorkspacesFixtureManifest } from "./demo-workspaces-fixture-manifest";
import { resolveLiveJwtMode } from "./live-api-auth";
import {
  expectBuyerPolishedReviewDetailShellReady,
  gotoLiveRunDetailPage,
} from "./operator-journey";
import {
  LIVE_E2E_DEFAULT_PROJECT_ID,
  LIVE_E2E_DEFAULT_TENANT_ID,
  LIVE_E2E_DEFAULT_WORKSPACE_ID,
  stubEmptyArchitectureDraftListRoute,
  waitForOperatorAuthMeProxyOk,
  primePrivateBetaBrowserSessionIfJwtMode,
  writeJwtBrowserSession,
} from "./live-private-beta-access";

const OPERATOR_SCOPE_STORAGE_KEY = "archlucid_operator_scope_v1";

export const DEMO_SCOPE_DEFAULT_TENANT_ID = demoWorkspacesFixtureManifest.defaultTenantId;

/** Stable Product Tour workspace A (Contoso storyline). */
export const DEMO_WORKSPACE_A_LIVE_IDS = {
  tenantId: DEMO_SCOPE_DEFAULT_TENANT_ID,
  workspaceId: demoWorkspacesFixtureManifest.workspaceA.workspaceId,
  projectId: demoWorkspacesFixtureManifest.workspaceA.projectId,
} as const;

export const DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID = demoWorkspacesFixtureManifest.workspaceA.runId;

/** Stable Meridian / Alpine regulated storyline (Workspace B). */
export const DEMO_WORKSPACE_B_LIVE_IDS = {
  tenantId: DEMO_SCOPE_DEFAULT_TENANT_ID,
  workspaceId: demoWorkspacesFixtureManifest.workspaceB.workspaceId,
  projectId: demoWorkspacesFixtureManifest.workspaceB.projectId,
} as const;

export const DEMO_WORKSPACE_B_REGULATED_RUN_ID = demoWorkspacesFixtureManifest.workspaceB.runId;

export type DemoWorkspaceScopeIds = {
  tenantId: string;
  workspaceId: string;
  projectId: string;
};

async function writeOperatorScopeToBrowser(
  page: Page,
  scope: DemoWorkspaceScopeIds,
  options?: {
    readonly persistViaInitScript?: boolean;
    /** Demo workspace runs set sample-visit chrome; default tenant admin scope must not (TB-927). */
    readonly sampleWorkspaceVisitActive?: boolean;
  },
): Promise<void> {
  const sampleWorkspaceVisitActive = options?.sampleWorkspaceVisitActive !== false;
  const suppressLs010BootstrapRedirect = sampleWorkspaceVisitActive === false;
  const scopeCookieValue = serializeOperatorScopeCookiePayload({
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
  });

  await page.context().addCookies([
    {
      name: OPERATOR_SCOPE_COOKIE_NAME,
      value: scopeCookieValue,
      url: new URL(page.url()).origin,
      sameSite: "Lax",
    },
  ]);

  await page.evaluate(
    (
      payload: {
        readonly key: string;
        readonly sampleVisitKey: string;
        readonly tenantId: string;
        readonly workspaceId: string;
        readonly projectId: string;
        readonly cookieName: string;
        readonly cookieValue: string;
        readonly sampleWorkspaceVisitActive: boolean;
        readonly suppressLs010BootstrapRedirect: boolean;
        readonly ls010BypassKey: string;
      },
    ) => {
      const record = {
        tenantId: payload.tenantId,
        workspaceId: payload.workspaceId,
        projectId: payload.projectId,
        workspaceLabel: "",
        projectLabel: "",
      };

      window.localStorage.setItem(payload.key, JSON.stringify(record));
      if (payload.sampleWorkspaceVisitActive) {
        window.sessionStorage.setItem(payload.sampleVisitKey, "1");
        window.sessionStorage.removeItem(payload.ls010BypassKey);
      } else {
        window.sessionStorage.removeItem(payload.sampleVisitKey);
        if (payload.suppressLs010BootstrapRedirect) {
          window.sessionStorage.setItem(payload.ls010BypassKey, "1");
        }
      }
      window.localStorage.setItem("archlucid.workspace-mode.v1.personal", "guided");
      document.cookie = `${payload.cookieName}=${payload.cookieValue}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax`;
    },
    {
      key: OPERATOR_SCOPE_STORAGE_KEY,
      sampleVisitKey: OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      cookieName: OPERATOR_SCOPE_COOKIE_NAME,
      cookieValue: scopeCookieValue,
      sampleWorkspaceVisitActive,
      suppressLs010BootstrapRedirect,
      ls010BypassKey: E2E_LS010_BOOTSTRAP_REDIRECT_SUPPRESS_STORAGE_KEY,
    },
  );

  if (options?.persistViaInitScript !== true) {
    return;
  }

  await page.addInitScript(
    (
      payload: {
        readonly key: string;
        readonly sampleVisitKey: string;
        readonly tenantId: string;
        readonly workspaceId: string;
        readonly projectId: string;
        readonly cookieName: string;
        readonly cookieValue: string;
        readonly sampleWorkspaceVisitActive: boolean;
        readonly suppressLs010BootstrapRedirect: boolean;
        readonly ls010BypassKey: string;
      },
    ) => {
      const record = {
        tenantId: payload.tenantId,
        workspaceId: payload.workspaceId,
        projectId: payload.projectId,
        workspaceLabel: "",
        projectLabel: "",
      };

      window.localStorage.setItem(payload.key, JSON.stringify(record));
      if (payload.sampleWorkspaceVisitActive) {
        window.sessionStorage.setItem(payload.sampleVisitKey, "1");
        window.sessionStorage.removeItem(payload.ls010BypassKey);
      } else {
        window.sessionStorage.removeItem(payload.sampleVisitKey);
        if (payload.suppressLs010BootstrapRedirect) {
          window.sessionStorage.setItem(payload.ls010BypassKey, "1");
        }
      }
      window.localStorage.setItem("archlucid.workspace-mode.v1.personal", "guided");
      document.cookie = `${payload.cookieName}=${payload.cookieValue}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax`;
    },
    {
      key: OPERATOR_SCOPE_STORAGE_KEY,
      sampleVisitKey: OPERATOR_SAMPLE_WORKSPACE_VISIT_STORAGE_KEY,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      cookieName: OPERATOR_SCOPE_COOKIE_NAME,
      cookieValue: scopeCookieValue,
      sampleWorkspaceVisitActive,
      suppressLs010BootstrapRedirect,
      ls010BypassKey: E2E_LS010_BOOTSTRAP_REDIRECT_SUPPRESS_STORAGE_KEY,
    },
  );
}

/** Re-commit demo tenant scope cookie/init script before a direct finding-detail navigation. */
export async function refreshDemoWorkspaceOperatorScopeForNavigation(
  page: Page,
  scope: DemoWorkspaceScopeIds,
): Promise<void> {
  await writeOperatorScopeToBrowser(page, scope, { persistViaInitScript: true });
}

/**
 * Mirrors `OperatorScopeRecord` minimal shape so `/api/proxy` forwards tenant/workspace/project on run detail hydration.
 * Also mirrors the scope cookie (`TB-075`) so RSC run-detail SSR (`getServerResolvedScopeHeaders`) matches
 * `freshIsolatedTenantScope` API calls — localStorage alone is invisible to the server on first paint.
 */
export async function injectDemoWorkspaceOperatorScope(
  page: Page,
  scope: DemoWorkspaceScopeIds,
): Promise<void> {
  // Home chrome mounts draft inventory; cold SQL list reads can block proxy for 60s during scope priming navigations.
  await stubEmptyArchitectureDraftListRoute(page);

  // Establish the Playwright origin before setting cookies so the first RSC navigation to run detail
  // includes archlucid_operator_scope_v1 (isolated tenant scope for live-api-journey).
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await writeOperatorScopeToBrowser(page, scope, { persistViaInitScript: true });

  // Init script only runs on navigations after registration — reload once so localStorage and
  // document.cookie mirror the SSR cookie before isolated-tenant run-detail RSC hydration.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  if (resolveLiveJwtMode()) {
    await waitForOperatorAuthMeProxyOk(page);
  }
}

/** Resets operator scope to CI default tenant/workspace so admin settings pages keep DevelopmentBypass Admin. */
export async function injectDefaultTenantOperatorScope(
  page: Page,
  options?: {
    readonly reestablishJwtSession?: boolean;
    /** Re-issues BFF cookies for invitee principals when admin re-prime is skipped (TB-927). */
    readonly jwtAccessToken?: string;
    /** Default true for admin JwtBearer CI; false for live-seat invitee scope (TB-927) with LS-010 bypass. */
    readonly sampleWorkspaceVisitActive?: boolean;
  },
): Promise<void> {
  const defaultScope = {
    tenantId: LIVE_E2E_DEFAULT_TENANT_ID,
    workspaceId: LIVE_E2E_DEFAULT_WORKSPACE_ID,
    projectId: LIVE_E2E_DEFAULT_PROJECT_ID,
  };

  await stubEmptyArchitectureDraftListRoute(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Register after demo-workspace init scripts in the same browser context so default scope wins
  // on every subsequent navigation (admin settings requires default tenant Admin, not demo scope).
  // Keep sample-visit active for dev-default scope unless invitee live-seat inject opts out (TB-927).
  await writeOperatorScopeToBrowser(page, defaultScope, {
    persistViaInitScript: true,
    sampleWorkspaceVisitActive: options?.sampleWorkspaceVisitActive !== false,
  });

  // Init script only runs on navigations after registration — reload once so scope is committed
  // before the first /administration/users RSC flight.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  if (resolveLiveJwtMode()) {
    if (options?.reestablishJwtSession !== false) {
      await primePrivateBetaBrowserSessionIfJwtMode(page);
      await waitForOperatorAuthMeProxyOk(page);
    } else {
      const inviteeToken = options?.jwtAccessToken?.trim() ?? "";
      if (inviteeToken.length > 0) {
        await writeJwtBrowserSession(page, inviteeToken);
      }
      // TB-927 asserts /me via fetchAuthMeViaProxy immediately after scope reset.
    }
  }
}

/** LS-010 can trap JwtBearer CI on /auth/bootstrap when sample-visit is cleared on dev-default scope. */
export async function recoverFromAuthBootstrapIfNeeded(
  page: Page,
  targetPath: string,
): Promise<void> {
  if (!page.url().includes("/auth/bootstrap")) {
    return;
  }

  await primePrivateBetaBrowserSessionIfJwtMode(page);
  await injectDefaultTenantOperatorScope(page);
  await page.goto(targetPath, { waitUntil: "domcontentloaded", timeout: 90_000 });
}

/**
 * Opens a SQL-backed demo workspace run detail with cold-start retries.
 * First RSC flight can miss the scope cookie or hit a transient API fault (same pattern as
 * `live-api-journey.spec.ts`). Buyer shell SSR uses `/buyer-summary`.
 */
export async function openDemoWorkspaceReviewDetailShellReady(
  page: Page,
  scope: DemoWorkspaceScopeIds,
  runId: string,
  options?: { readonly timeoutMs?: number },
): Promise<void> {
  const attemptTimeoutMs = options?.timeoutMs ?? 45_000;
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await injectDemoWorkspaceOperatorScope(page, scope);
    await gotoLiveRunDetailPage(page, runId);

    try {
      const timeoutMs =
        attempt === maxAttempts ? Math.max(attemptTimeoutMs, 120_000) : attemptTimeoutMs;

      await expectBuyerPolishedReviewDetailShellReady(page, { timeoutMs });

      return;
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) {
        break;
      }
    }
  }

  throw lastError;
}
