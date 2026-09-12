import { RUN_PROGRESS_TRACKER_REHEARSAL_INCOMPLETE_TERMINAL_STATUS } from "@/lib/runs/run-progress-tracker-career-honesty";

/** CE-012 — labeled envelope complete is not Career-complete / Ready-to-finalize. */
export const CHEAP_EXPLORATION_ENVELOPE_NOT_CAREER_COMPLETE_OWNER = "CE-012" as const;

export const CHEAP_EXPLORATION_ENVELOPE_COMPLETE_NOT_READY_COPY =
  "Envelope analysis may finish without a Career seal — rehearsal-stamped sketches stay practice until you execute a Record review and finalize." as const;

export const CHEAP_EXPLORATION_ENVELOPE_TERMINAL_STATUS_HINT =
  RUN_PROGRESS_TRACKER_REHEARSAL_INCOMPLETE_TERMINAL_STATUS;
