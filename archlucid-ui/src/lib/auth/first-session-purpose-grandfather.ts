import type { UserPreferencesResponse } from "@/lib/api/user-preferences-types";
import { readDedicatedWorkspaceScope } from "@/lib/operator/operator-dedicated-workspace-storage";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import {
  isSampleWorkspaceScope,
  resolveDedicatedWorkspaceCandidate,
} from "@/lib/operator/operator-workspace-scope-model";

/** Existing operators who already personalized their seat should not see the first-login chooser. */
export function shouldGrandfatherFirstSessionPurposeAsLive(
  preferences: UserPreferencesResponse,
): boolean {
  if (preferences.firstSessionPurposeIsExplicit) {
    return false;
  }

  if (preferences.workspaceModeIsExplicit) {
    return true;
  }

  const dedicated =
    resolveDedicatedWorkspaceCandidate()
    ?? readDedicatedWorkspaceScope()
    ?? readOperatorScopeFromStorage();

  if (dedicated !== null && !isSampleWorkspaceScope(dedicated)) {
    return true;
  }

  return false;
}
