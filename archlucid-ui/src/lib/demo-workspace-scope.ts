/**
 * Pinned demo workspace scope — keep aligned with
 * `fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json` and `DemoWorkspaceStableIds`.
 */
const DEMO_WORKSPACE_MANIFEST = {
  defaultTenantId: "11111111-1111-1111-1111-111111111111",
  workspaceA: {
    runId: "b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf",
    workspaceId: "2b2571e1-1884-62a2-1e8b-15a2a70a0342",
    projectId: "9beb918c-83d4-1385-0486-21f341806c5c",
  },
  workspaceB: {
    runId: "61c60d76-2b80-93f9-46bb-2f66fd608b9b",
    workspaceId: "3f1a16c3-172e-5632-c53a-3ed16446f603",
    projectId: "49074cdf-bdab-a5fa-789b-09a3e556a8f2",
  },
} as const;

function normalizeRunId(runId: string): string {
  return runId.trim().replace(/-/g, "").toLowerCase();
}

/** Scope headers for SQL-backed demo workspace runs (see `docs/go-to-market/DEMO_WORKSPACES.md`). */
export function resolveDemoWorkspaceScopeHeadersForRunId(runId: string): Record<string, string> | null {
  const normalized = normalizeRunId(runId);

  if (normalized === normalizeRunId(DEMO_WORKSPACE_MANIFEST.workspaceA.runId)) {
    return {
      "x-tenant-id": DEMO_WORKSPACE_MANIFEST.defaultTenantId,
      "x-workspace-id": DEMO_WORKSPACE_MANIFEST.workspaceA.workspaceId,
      "x-project-id": DEMO_WORKSPACE_MANIFEST.workspaceA.projectId,
    };
  }

  if (normalized === normalizeRunId(DEMO_WORKSPACE_MANIFEST.workspaceB.runId)) {
    return {
      "x-tenant-id": DEMO_WORKSPACE_MANIFEST.defaultTenantId,
      "x-workspace-id": DEMO_WORKSPACE_MANIFEST.workspaceB.workspaceId,
      "x-project-id": DEMO_WORKSPACE_MANIFEST.workspaceB.projectId,
    };
  }

  return null;
}

export function isPinnedDemoWorkspaceRunId(runId: string): boolean {
  return resolveDemoWorkspaceScopeHeadersForRunId(runId) !== null;
}
