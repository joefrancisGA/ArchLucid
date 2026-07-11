import "server-only";

import { resolveDemoWorkspaceScopeHeadersForRunId } from "@/lib/demo-workspace-scope";
import { getServerResolvedScopeHeaders } from "@/lib/server-operator-scope";

/** Server RSC scope for run-scoped API calls — pinned demo workspace runs first, then cookie/env defaults. */
export async function resolveServerScopeHeadersForRun(runId: string): Promise<Record<string, string>> {
  const demoScopeHeaders = resolveDemoWorkspaceScopeHeadersForRunId(runId);

  if (demoScopeHeaders !== null) {
    return demoScopeHeaders;
  }

  return getServerResolvedScopeHeaders();
}
