/**
 * Seeds browser operator scope (`archlucid_operator_scope_v1`) for SQL-backed demo workspace runs — see `docs/go-to-market/DEMO_WORKSPACES.md`.
 * Stable GUIDs are pinned in `fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json` (Playwright + CI parity).
 */
import type { Page } from "@playwright/test";

import {
  OPERATOR_SCOPE_COOKIE_NAME,
  serializeOperatorScopeCookiePayload,
} from "@/lib/operator/operator-scope-cookie";

import { demoWorkspacesFixtureManifest } from "./demo-workspaces-fixture-manifest";
import {
  expectBuyerPolishedReviewDetailShellReady,
  gotoLiveRunDetailPage,
} from "./operator-journey";

const OPERATOR_SCOPE_STORAGE_KEY = "archlucid_operator_scope_v1";

/** Playwright `baseURL` / live E2E webServer origin — cookie must match for SSR scope on first navigation. */
const LIVE_E2E_OPERATOR_ORIGIN = "http://127.0.0.1:3000";

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

/**
 * Mirrors `OperatorScopeRecord` minimal shape so `/api/proxy` forwards tenant/workspace/project on run detail hydration.
 * Also mirrors the scope cookie (`TB-075`) so RSC run-detail SSR (`getServerResolvedScopeHeaders`) matches
 * `freshIsolatedTenantScope` API calls — localStorage alone is invisible to the server on first paint.
 */
export async function injectDemoWorkspaceOperatorScope(
  page: Page,
  scope: DemoWorkspaceScopeIds,
): Promise<void> {
  const scopeCookieValue = serializeOperatorScopeCookiePayload({
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
  });

  // Establish the Playwright origin before setting cookies so the first RSC navigation to run detail
  // includes archlucid_operator_scope_v1 (isolated tenant scope for live-api-journey).
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.context().addCookies([
    {
      name: OPERATOR_SCOPE_COOKIE_NAME,
      value: scopeCookieValue,
      url: LIVE_E2E_OPERATOR_ORIGIN,
      sameSite: "Lax",
    },
  ]);

  await page.addInitScript(
    (
      payload: {
        readonly key: string;
        readonly tenantId: string;
        readonly workspaceId: string;
        readonly projectId: string;
        readonly cookieName: string;
        readonly cookieValue: string;
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
      document.cookie = `${payload.cookieName}=${payload.cookieValue}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax`;
    },
    {
      key: OPERATOR_SCOPE_STORAGE_KEY,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
      cookieName: OPERATOR_SCOPE_COOKIE_NAME,
      cookieValue: scopeCookieValue,
    },
  );

  // Init script only runs on navigations after registration — reload once so localStorage and
  // document.cookie mirror the SSR cookie before isolated-tenant run-detail RSC hydration.
  await page.goto("/", { waitUntil: "domcontentloaded" });
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
