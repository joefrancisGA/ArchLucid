/** SN-003 / WA-10: spawn-locked draft URLs are snapshots — clone is the legal new version (ADR 0072). */

export const ARCHITECTURE_DRAFT_SPAWN_LOCK_SNAPSHOT_SENTENCE =
  "This URL opens a read-only snapshot from when the review started — not the live editor.";

export const ARCHITECTURE_DRAFT_SPAWN_LOCK_CLONE_LEGAL_SENTENCE =
  "To change the architecture, start a new draft from this snapshot. That is the legal new version; edits here do not update the linked review.";

export const ARCHITECTURE_DRAFT_SPAWN_LOCK_WORKSPACE_LEAD =
  "Snapshot handoff — this draft is read-only after review spawn. Continue in the linked review or clone a new draft.";

export const ARCHITECTURE_DRAFT_SPAWN_LOCK_PANEL_TITLE = "Snapshot handoff";

export function resolveArchitectureDraftSpawnLockWorkspaceLead(
  handoffEditorLocked: boolean,
  defaultLead: string,
): string {
  if (handoffEditorLocked) {
    return ARCHITECTURE_DRAFT_SPAWN_LOCK_WORKSPACE_LEAD;
  }

  return defaultLead;
}
