import {
  defaultLabelsForScopeIds,
  readOperatorScopeFromStorage,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import { DEV_SCOPE_PROJECT_ID, DEV_SCOPE_WORKSPACE_ID } from "@/lib/scope";
import { workspaceShortNameFromLabel } from "@/lib/scope-switcher-display";

/**
 * Short workspace name for in-page scope statements — the same precedence the top-bar
 * scope switcher uses (stored operator label, then a neutral label derived from the scope IDs).
 * Governance mutations need the target workspace named next to the control, not only in the
 * top bar, because a rule written against the wrong workspace is not recoverable from the UI.
 */
export function resolveWorkspaceScopeLabelFromRecord(record: OperatorScopeRecord | null): string {
  const workspaceId: string = record?.workspaceId ?? DEV_SCOPE_WORKSPACE_ID;
  const projectId: string = record?.projectId ?? DEV_SCOPE_PROJECT_ID;
  const fallback: string = defaultLabelsForScopeIds(workspaceId, projectId).workspace;

  if (record !== null && record.workspaceLabel.trim().length > 0) {
    return workspaceShortNameFromLabel(record.workspaceLabel);
  }

  return workspaceShortNameFromLabel(fallback);
}

/** Browser-side reader; returns the dev-default label during SSR where storage is absent. */
export function readActiveWorkspaceScopeLabel(): string {
  return resolveWorkspaceScopeLabelFromRecord(readOperatorScopeFromStorage());
}
