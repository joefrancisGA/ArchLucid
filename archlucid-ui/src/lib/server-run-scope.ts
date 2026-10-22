import "server-only";

import {
  resolveDemoWorkspaceScopeHeadersForProjectId,
  resolveDemoWorkspaceScopeHeadersForRunId,
} from "@/lib/demo-workspace-scope";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";
import {
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";

/** Server RSC scope for run-scoped API calls — pinned demo workspace runs first, then cookie/env defaults. */
export async function resolveServerScopeHeadersForRun(runId: string): Promise<Record<string, string>> {
  const demoScopeHeaders = resolveDemoWorkspaceScopeHeadersForRunId(runId);

  if (demoScopeHeaders !== null) {
    return demoScopeHeaders;
  }

  return getServerResolvedScopeHeaders();
}

/** Server RSC scope for project-scoped list calls — pinned demo workspace project id first, then cookie/env defaults. */
export async function resolveServerScopeHeadersForProject(projectId: string): Promise<Record<string, string>> {
  const demoScopeHeaders = resolveDemoWorkspaceScopeHeadersForProjectId(projectId);

  if (demoScopeHeaders !== null) {
    return demoScopeHeaders;
  }

  return getServerResolvedScopeHeaders();
}

/** Server RSC scope for manifest detail — pinned showcase manifest id first, then cookie/env defaults. */
export async function resolveServerScopeHeadersForManifest(manifestId: string): Promise<Record<string, string>> {
  const trimmedManifestId = manifestId.trim();

  if (trimmedManifestId === SHOWCASE_STATIC_DEMO_MANIFEST_ID) {
    const demoScopeHeaders = resolveDemoWorkspaceScopeHeadersForRunId(SHOWCASE_STATIC_DEMO_RUN_ID);

    if (demoScopeHeaders !== null) {
      return demoScopeHeaders;
    }
  }

  return getServerResolvedScopeHeaders();
}
