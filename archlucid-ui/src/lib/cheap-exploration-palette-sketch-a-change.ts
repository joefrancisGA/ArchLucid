import { isCommandPaletteCloneFromSnapshotAvailable } from "@/lib/command-palette-work-action-dom";
import { CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL } from "@/lib/cheap-exploration-adr-inventory";
import {
  CHEAP_EXPLORATION_ENVELOPE_RUNNER_DOM_TEST_ID,
  CHEAP_EXPLORATION_ENVELOPE_RUNNER_OWNER,
} from "@/lib/cheap-exploration-envelope-runner-entry";
import { SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID } from "@/lib/system-not-job-palette-clone-new-version";

/** CE-013 — palette work action for cheap envelope sketch on architecture desk. */
export const CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_OWNER = "CE-013" as const;

export const CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_ACTION_ID =
  SYSTEM_NOT_JOB_PALETTE_CLONE_NEW_VERSION_ACTION_ID;

export const CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_SEARCH_VALUE =
  "sketch a change clone snapshot rehearsal envelope architecture desk palette" as const;

const architectureDraftPathPattern = /^\/architecture\/architectures(\/|$)/;

export function isCheapExplorationPaletteSketchArchitecturePath(pathname: string): boolean {
  return architectureDraftPathPattern.test(pathname);
}

/**
 * CE-013 / CE-037: palette row is live only when spawn-lock clone CTA is visible — Guided eval
 * without spawn lock never shows a dead row.
 */
export function resolveCheapExplorationPaletteSketchVisible(pathname: string): boolean {
  if (!isCheapExplorationPaletteSketchArchitecturePath(pathname)) {
    return false;
  }

  return isCommandPaletteCloneFromSnapshotAvailable();
}

export const CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_HANDLER = {
  owner: CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_OWNER,
  runnerOwner: CHEAP_EXPLORATION_ENVELOPE_RUNNER_OWNER,
  id: CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_ACTION_ID,
  label: CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL,
  searchValue: CHEAP_EXPLORATION_PALETTE_SKETCH_A_CHANGE_SEARCH_VALUE,
  domTestId: CHEAP_EXPLORATION_ENVELOPE_RUNNER_DOM_TEST_ID,
  costCapChromeModule: "system-not-job-what-if-cost-cap-chrome",
} as const;
