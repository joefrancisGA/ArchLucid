/**
 * Seeds browser operator scope (`archlucid_operator_scope_v1`) for SQL-backed demo workspace runs — see `docs/go-to-market/DEMO_WORKSPACES.md`.
 * Stable GUIDs are pinned in `fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json` (Playwright + CI parity).
 */
import type { Page } from "@playwright/test";

import { demoWorkspacesFixtureManifest } from "./demo-workspaces-fixture-manifest";

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

/**
 * Mirrors `OperatorScopeRecord` minimal shape so `/api/proxy` forwards tenant/workspace/project on run detail hydration.
 */
export async function injectDemoWorkspaceOperatorScope(
  page: Page,
  scope: DemoWorkspaceScopeIds,
): Promise<void> {
  await page.addInitScript(
    (
      payload: {
        readonly key: string;
        readonly tenantId: string;
        readonly workspaceId: string;
        readonly projectId: string;
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
    },
    {
      key: OPERATOR_SCOPE_STORAGE_KEY,
      tenantId: scope.tenantId,
      workspaceId: scope.workspaceId,
      projectId: scope.projectId,
    },
  );
}
