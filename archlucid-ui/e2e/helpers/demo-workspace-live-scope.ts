/**
 * Seeds browser operator scope (`archlucid_operator_scope_v1`) for SQL-backed demo workspace runs — see `docs/go-to-market/DEMO_WORKSPACES.md`.
 */
import type { Page } from "@playwright/test";

const OPERATOR_SCOPE_STORAGE_KEY = "archlucid_operator_scope_v1";

export const DEMO_SCOPE_DEFAULT_TENANT_ID = "11111111-1111-1111-1111-111111111111";

/** Stable Product Tour workspace A (Contoso storyline). */
export const DEMO_WORKSPACE_A_LIVE_IDS = {
  tenantId: DEMO_SCOPE_DEFAULT_TENANT_ID,
  workspaceId: "2b2571e1-1884-62a2-1e8b-15a2a70a0342",
  projectId: "9beb918c-83d4-1385-0486-21f341806c5c",
} as const;

export const DEMO_WORKSPACE_A_PRODUCT_TOUR_RUN_ID = "b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf";

/** Stable Meridian / Alpine regulated storyline (Workspace B). */
export const DEMO_WORKSPACE_B_LIVE_IDS = {
  tenantId: DEMO_SCOPE_DEFAULT_TENANT_ID,
  workspaceId: "3f1a16c3-172e-5632-c53a-3ed16446f603",
  projectId: "49074cdf-bdab-a5fa-789b-09a3e556a8f2",
} as const;

export const DEMO_WORKSPACE_B_REGULATED_RUN_ID = "61c60d76-2b80-93f9-46bb-2f66fd608b9b";

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
