import {
  clearDedicatedWorkspaceScope,
  readDedicatedWorkspaceScope,
  writeDedicatedWorkspaceScope,
} from "@/lib/operator/operator-dedicated-workspace-storage";
import { resolveDedicatedScopeFromRemoteBootstrap } from "@/lib/operator/operator-scope-remote-bootstrap";
import {
  clearSampleWorkspaceVisitActive,
  isSampleWorkspaceVisitActive,
} from "@/lib/operator/operator-sample-workspace-visit";
import {
  isSampleWorkspaceScope,
  resolveDedicatedWorkspaceCandidate,
} from "@/lib/operator/operator-workspace-scope-model";
import {
  readOperatorScopeFromStorage,
  writeOperatorScopeToStorage,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import { isLikelySignedIn } from "@/lib/oidc/session";

export function persistDedicatedWorkspaceScope(record: OperatorScopeRecord): void {
  writeDedicatedWorkspaceScope(record);
}

export function applyDedicatedWorkspaceScope(record: OperatorScopeRecord): void {
  persistDedicatedWorkspaceScope(record);
  clearSampleWorkspaceVisitActive();
  writeOperatorScopeToStorage(record);
}

export function shouldBootstrapDedicatedWorkspaceScope(): boolean {
  if (!isLikelySignedIn()) {
    return false;
  }

  if (isSampleWorkspaceVisitActive()) {
    return false;
  }

  const stored = readOperatorScopeFromStorage();

  if (stored !== null && !isSampleWorkspaceScope(stored)) {
    persistDedicatedWorkspaceScope(stored);

    return false;
  }

  return true;
}

/** Signed-in operators land on their dedicated workspace instead of dev-default demo scope. */
export async function bootstrapDedicatedWorkspaceScope(): Promise<boolean> {
  if (!shouldBootstrapDedicatedWorkspaceScope()) {
    return false;
  }

  const existingDedicated = readDedicatedWorkspaceScope();
  const candidate =
    resolveDedicatedWorkspaceCandidate()
    ?? (existingDedicated !== null && !isSampleWorkspaceScope(existingDedicated) ? existingDedicated : null)
    ?? await resolveDedicatedScopeFromRemoteBootstrap();

  if (candidate === null || candidate.projectId.trim().length === 0) {
    if (candidate !== null && candidate.projectId.trim().length === 0) {
      return false;
    }

    return false;
  }

  if (isSampleWorkspaceScope(candidate)) {
    return false;
  }

  applyDedicatedWorkspaceScope(candidate);

  return true;
}

export function returnToDedicatedWorkspaceFromSample(): boolean {
  const dedicated = readDedicatedWorkspaceScope() ?? resolveDedicatedWorkspaceCandidate();

  if (dedicated === null || isSampleWorkspaceScope(dedicated)) {
    clearDedicatedWorkspaceScope();
    clearSampleWorkspaceVisitActive();

    return false;
  }

  applyDedicatedWorkspaceScope(dedicated);

  return true;
}
