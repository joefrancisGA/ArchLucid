import demoManifest from "../../fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json";

type DemoWorkspaceFixtureManifest = {
  readonly defaultTenantId: string;
  readonly workspaceA: {
    readonly runId: string;
    readonly workspaceId: string;
    readonly projectId: string;
  };
  readonly workspaceB: {
    readonly runId: string;
    readonly workspaceId: string;
    readonly projectId: string;
  };
};

const manifest = demoManifest as DemoWorkspaceFixtureManifest;

function normalizeRunId(runId: string): string {
  return runId.trim().replace(/-/g, "").toLowerCase();
}

/** Scope headers for SQL-backed demo workspace runs (see `docs/go-to-market/DEMO_WORKSPACES.md`). */
export function resolveDemoWorkspaceScopeHeadersForRunId(runId: string): Record<string, string> | null {
  const normalized = normalizeRunId(runId);

  if (normalized === normalizeRunId(manifest.workspaceA.runId)) {
    return {
      "x-tenant-id": manifest.defaultTenantId,
      "x-workspace-id": manifest.workspaceA.workspaceId,
      "x-project-id": manifest.workspaceA.projectId,
    };
  }

  if (normalized === normalizeRunId(manifest.workspaceB.runId)) {
    return {
      "x-tenant-id": manifest.defaultTenantId,
      "x-workspace-id": manifest.workspaceB.workspaceId,
      "x-project-id": manifest.workspaceB.projectId,
    };
  }

  return null;
}

export function isPinnedDemoWorkspaceRunId(runId: string): boolean {
  return resolveDemoWorkspaceScopeHeadersForRunId(runId) !== null;
}
