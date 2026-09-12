/** SN-033 — command palette clone when spawn-locked; SN-009 cost cap in confirm dialog. */
import { isCommandPaletteCloneFromSnapshotAvailable } from "@/lib/command-palette-work-action-dom";
import {
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL,
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID,
} from "@/lib/system-not-job-clone-from-snapshot-entry";

/** Relative to repository root (parent of archlucid-ui). */
export const SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_DOC_ANCHOR =
  "docs/architecture/adrs/0092-working-cheap-what-if-envelope.md" as const;

/** SN-033 palette handler id — must stay aligned with command-palette-handler-actions. */
export const SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID = "action-clone-from-snapshot" as const;

export const SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_EVENT =
  "archlucid-command-palette-clone-from-snapshot" as const;

export const SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_SEARCH_VALUE =
  "action clone snapshot spawn locked new version architecture sketch palette" as const;

const architectureDraftPathPattern = /^\/architecture\/architectures(\/|$)/;

export function isSystemNotJobPaletteCloneArchitectureDraftPath(pathname: string): boolean {
  return architectureDraftPathPattern.test(pathname);
}

/**
 * SN-033: palette row is live only when spawn-lock clone CTA is visible on the page.
 * Hidden when not spawn-locked — never a dead row.
 */
export function resolveSystemNotJobPaletteCloneNewVersionVisible(pathname: string): boolean {
  if (!isSystemNotJobPaletteCloneArchitectureDraftPath(pathname)) {
    return false;
  }

  return isCommandPaletteCloneFromSnapshotAvailable();
}

export const SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_HANDLER = {
  id: SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID,
  label: SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_DESK_CTA_LABEL,
  searchValue: SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_SEARCH_VALUE,
  domTestId: SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID,
  eventName: SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_EVENT,
  confirmDialogTestId: "architecture-draft-clone-snapshot-confirm",
  costCapChromeModule: "system-not-job-what-if-cost-cap-chrome",
} as const;
