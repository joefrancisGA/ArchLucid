import {
  readDedicatedWorkspaceScope,
  writeDedicatedWorkspaceScope,
} from "@/lib/operator/operator-dedicated-workspace-storage";
import { markSampleWorkspaceVisitActive } from "@/lib/operator/operator-sample-workspace-visit";
import {
  readOperatorScopeFromStorage,
  writeOperatorScopeToStorage,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import { recordLiveSeatScopeLandingOnce } from "@/lib/live-seat-funnel-telemetry";
import {
  buildCustomerIntakeDemoScopeRecord,
  isSampleWorkspaceScope,
  resolveDedicatedWorkspaceCandidate,
} from "@/lib/operator/operator-workspace-scope-model";

/** Persist the operator's real workspace before an explicit sample-workspace visit. */
export function captureDedicatedWorkspaceFromCurrentScope(): void {
  const existingDedicated = readDedicatedWorkspaceScope();

  if (existingDedicated !== null && !isSampleWorkspaceScope(existingDedicated)) {
    return;
  }

  const candidate = resolveDedicatedWorkspaceCandidate();

  if (candidate !== null) {
    writeDedicatedWorkspaceScope(candidate);

    return;
  }

  const stored = readOperatorScopeFromStorage();

  if (stored !== null && !isSampleWorkspaceScope(stored)) {
    writeDedicatedWorkspaceScope(stored);
  }
}

/** Opt into the Customer Intake Demo sample workspace for this tab. */
export function visitSampleWorkspaceScope(): OperatorScopeRecord {
  captureDedicatedWorkspaceFromCurrentScope();
  markSampleWorkspaceVisitActive();
  const sample = buildCustomerIntakeDemoScopeRecord();
  writeOperatorScopeToStorage(sample);
  recordLiveSeatScopeLandingOnce(true);

  return sample;
}
