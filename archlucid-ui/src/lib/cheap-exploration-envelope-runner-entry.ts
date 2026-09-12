import {
  CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH,
  CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL,
} from "@/lib/cheap-exploration-adr-inventory";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";
import { SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID } from "@/lib/system-not-job-clone-from-snapshot-entry";

/** CE-001 — Working cheap envelope runner entry (ADR 0092). */
export const CHEAP_EXPLORATION_ENVELOPE_RUNNER_DOC_ANCHOR = CHEAP_EXPLORATION_ADR_0092_RELATIVE_PATH;

export const CHEAP_EXPLORATION_ENVELOPE_RUNNER_OWNER = "CE-001" as const;

export { CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL };

export const CHEAP_EXPLORATION_ENVELOPE_RUNNER_DOM_TEST_ID =
  SYSTEM_NOT_JOB_CLONE_FROM_SNAPSHOT_SPAWN_LOCK_DOM_TEST_ID;

export const CHEAP_EXPLORATION_ENVELOPE_RUNNER_HELPER =
  "Clone from the sealed snapshot into a new editable draft — Rehearsal-stamped architecture sketch until you explicitly execute a Record review." as const;

export function cheapExplorationArchitectureDeskHref(architectureId: string): string {
  return architectureIdentityPath(architectureId.trim());
}
