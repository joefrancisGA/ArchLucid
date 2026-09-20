import { recordLiveSeatScopeLandingOnce } from "@/lib/live-seat-funnel-telemetry";
import { applyDedicatedWorkspaceScope } from "@/lib/operator/operator-scope-bootstrap";
import { clearSampleWorkspaceVisitActive } from "@/lib/operator/operator-sample-workspace-visit";
import {
  isSampleWorkspaceScope,
  operatorScopeRecordFromProxyHeaders,
} from "@/lib/operator/operator-workspace-scope-model";
import { readProxyScopeFromAuthorizationHeader } from "@/lib/proxy-bearer-scope";

/** Applies JWT tenant/workspace/project scope after post-auth Complete (before redirect). */
export function applyDedicatedWorkspaceScopeFromAccessToken(accessToken: string): boolean {
  clearSampleWorkspaceVisitActive();

  const scopeHeaders = readProxyScopeFromAuthorizationHeader(`Bearer ${accessToken.trim()}`);

  if (scopeHeaders === null) {
    return false;
  }

  const record = operatorScopeRecordFromProxyHeaders(scopeHeaders);

  if (isSampleWorkspaceScope(record)) {
    return false;
  }

  applyDedicatedWorkspaceScope(record);
  recordLiveSeatScopeLandingOnce(false);

  return true;
}
