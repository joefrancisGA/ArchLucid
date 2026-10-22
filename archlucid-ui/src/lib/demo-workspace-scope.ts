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

/** Canonical Product Tour (Workspace A) run — keep aligned with fixture manifest. */
export const DEMO_WORKSPACE_A_RUN_ID = DEMO_WORKSPACE_MANIFEST.workspaceA.runId;

/** Canonical regulated storyline (Workspace B) run — keep aligned with fixture manifest. */
export const DEMO_WORKSPACE_B_RUN_ID = DEMO_WORKSPACE_MANIFEST.workspaceB.runId;

function normalizeRunId(runId: string): string {
  return runId.trim().replace(/-/g, "").toLowerCase();
}

function normalizeProjectId(projectId: string): string {
  return projectId.trim().replace(/-/g, "").toLowerCase();
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

/** Scope headers when `/architecture/reviews?projectId=…` targets a pinned SQL demo workspace project. */
export function resolveDemoWorkspaceScopeHeadersForProjectId(projectId: string): Record<string, string> | null {
  const normalized = normalizeProjectId(projectId);

  if (normalized === normalizeProjectId(DEMO_WORKSPACE_MANIFEST.workspaceA.projectId)) {
    return {
      "x-tenant-id": DEMO_WORKSPACE_MANIFEST.defaultTenantId,
      "x-workspace-id": DEMO_WORKSPACE_MANIFEST.workspaceA.workspaceId,
      "x-project-id": DEMO_WORKSPACE_MANIFEST.workspaceA.projectId,
    };
  }

  if (normalized === normalizeProjectId(DEMO_WORKSPACE_MANIFEST.workspaceB.projectId)) {
    return {
      "x-tenant-id": DEMO_WORKSPACE_MANIFEST.defaultTenantId,
      "x-workspace-id": DEMO_WORKSPACE_MANIFEST.workspaceB.workspaceId,
      "x-project-id": DEMO_WORKSPACE_MANIFEST.workspaceB.projectId,
    };
  }

  return null;
}

function decodeProxyPathRunIdSegment(rawRunId: string): string {
  try {
    return decodeURIComponent(rawRunId);
  } catch {
    return rawRunId;
  }
}

/** Extracts a run id from common `/api/proxy/v1/...` tails (pilots, authority, architecture). */
export function extractRunIdFromProxyPath(proxyPath: string): string | null {
  const normalized = proxyPath.replace(/^\/+/, "");
  const pilots = /^v1\/pilots\/runs\/([^/]+)(?:\/|$)/i.exec(normalized);

  if (pilots?.[1] !== undefined) {
    return decodeProxyPathRunIdSegment(pilots[1]);
  }

  const authority = /^v1\/authority\/runs\/([^/]+)(?:\/|$)/i.exec(normalized);

  if (authority?.[1] !== undefined) {
    return decodeProxyPathRunIdSegment(authority[1]);
  }

  const architecture = /^v1\/architecture\/run\/([^/]+)(?:\/|$)/i.exec(normalized);

  if (architecture?.[1] !== undefined) {
    return decodeProxyPathRunIdSegment(architecture[1]);
  }

  return null;
}

/**
 * Pinned SQL-backed demo workspace runs carry scope on RSC fetches; mirror that on browser `/api/proxy`
 * so pilot-run-deltas and other run-scoped calls succeed in production standalone (live E2E).
 */
export function resolveDemoWorkspaceScopeHeadersFromProxyPath(
  proxyPath: string,
): Record<string, string> | null {
  const runId = extractRunIdFromProxyPath(proxyPath);

  if (runId === null) {
    return null;
  }

  return resolveDemoWorkspaceScopeHeadersForRunId(runId);
}
