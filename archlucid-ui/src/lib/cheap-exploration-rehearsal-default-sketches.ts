import { DEFAULT_WORKING_CAREER_REHEARSAL_DOOR } from "@/lib/governance/working-career-rehearsal-door";
import { resolveSystemNotJobCloneFromSnapshotConfirmCopy } from "@/lib/system-not-job-clone-from-snapshot-entry";

/** CE-004 — cheap envelope sketches default Rehearsal even on Career desk until explicit Record execute. */
export const CHEAP_EXPLORATION_REHEARSAL_DEFAULT_SKETCHES_OWNER = "CE-004" as const;

export const CHEAP_EXPLORATION_REHEARSAL_DEFAULT_DOOR = DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;

export function resolveCheapExplorationSketchConfirmDescription(): string {
  return resolveSystemNotJobCloneFromSnapshotConfirmCopy({
    effectiveDoor: CHEAP_EXPLORATION_REHEARSAL_DEFAULT_DOOR,
  }).description;
}
