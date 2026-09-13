import { CHEAP_EXPLORATION_ENVELOPE_RUNNER_HELPER } from "@/lib/cheap-exploration-envelope-runner-entry";
import { CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL } from "@/lib/cheap-exploration-adr-inventory";
import { ARCHITECTURE_DESK_COMPARE_DISABLED_REASON } from "@/lib/system-not-job-compare-entry-from-desk";
import { WORKING_REHEARSAL_DOOR_LABEL } from "@/lib/governance/working-career-rehearsal-door-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** IH-047 — sketch entry helper on inhabited findings document. */
export const INHABIT_FINDINGS_SKETCH_HELPER = CHEAP_EXPLORATION_ENVELOPE_RUNNER_HELPER;

export const INHABIT_FINDINGS_SKETCH_CTA_LABEL = CHEAP_EXPLORATION_SKETCH_A_CHANGE_DESK_CTA_LABEL;

/** IH-049 — committed-manifest compare from architecture nested findings. */
export const INHABIT_FINDINGS_COMPARE_HELPER =
  "Compare committed child reviews of this architecture — committed manifests only, not draft-to-draft." as const;

export const INHABIT_FINDINGS_COMPARE_DISABLED_REASON = ARCHITECTURE_DESK_COMPARE_DISABLED_REASON;

/** IH-052 — Sketch is Practice, not Record. */
export const INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_TITLE =
  `${INHABIT_FINDINGS_SKETCH_CTA_LABEL} is ${WORKING_REHEARSAL_DOOR_LABEL}` as const;

export const INHABIT_SKETCH_IS_PRACTICE_NOT_RECORD_BODY =
  `${WORKING_REHEARSAL_DOOR_LABEL} sketches stay rehearsal-stamped until you explicitly execute a Record review and finalize. A sketch cannot seal as a Career record.` as const;

export const INHABIT_SKETCH_PRACTICE_HELP_HREF = inAppHelpHref("sketch-a-change");
