import {
  labelForWorkingCareerRehearsalDoor,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";
import {
  WORKING_CAREER_REHEARSAL_DOOR_CHANGE_CANCEL_ACTION,
  WORKING_CAREER_REHEARSAL_DOOR_CHANGE_CONFIRM_ACTION,
  WORKING_CAREER_REHEARSAL_DOOR_CHANGE_CONFIRM_TITLE,
} from "@/lib/governance/working-career-rehearsal-door-copy";
import { isTerminalOperationState, type OperationState } from "@/lib/operations/operation-state";

/** Minimal in-flight row for the CG-018 confirm gate (full store type is a superset). */
export type InFlightReviewPipelineRow = {
  readonly runId: string | null;
  readonly state: OperationState;
};

export type WorkingCareerRehearsalDoorChangeConfirmCopy = {
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
};

export type ShouldConfirmWorkingCareerRehearsalDoorChangeArgs = {
  readonly currentDoor: WorkingCareerRehearsalDoorId;
  readonly nextDoor: WorkingCareerRehearsalDoorId;
  readonly hasInFlightReviewPipeline: boolean;
};

/**
 * True when a review execute is still running (not terminal). Draft-only rows have no run id.
 * Retain-until-consumed Succeeded rows are finished analysis — they do not gate the door.
 */
export function hasInFlightReviewPipeline(
  operations: readonly InFlightReviewPipelineRow[],
): boolean {
  return operations.some((operation) => {
    const runId = operation.runId?.trim() ?? "";

    if (runId.length === 0) {
      return false;
    }

    return !isTerminalOperationState(operation.state);
  });
}

/** User-initiated door change during in-flight analysis must confirm — not a silent chrome flip. */
export function shouldConfirmWorkingCareerRehearsalDoorChange(
  args: ShouldConfirmWorkingCareerRehearsalDoorChangeArgs,
): boolean {
  if (args.nextDoor === args.currentDoor) {
    return false;
  }

  return args.hasInFlightReviewPipeline;
}

/**
 * Confirm copy names artifact impact. Stamp immutability on the run is CG-019.
 * This dialog must not stop the in-flight operation (AD-02 cancel stays on that affordance).
 */
export function resolveWorkingCareerRehearsalDoorChangeConfirmCopy(args: {
  readonly currentDoor: WorkingCareerRehearsalDoorId;
  readonly nextDoor: WorkingCareerRehearsalDoorId;
}): WorkingCareerRehearsalDoorChangeConfirmCopy {
  const fromLabel = labelForWorkingCareerRehearsalDoor(args.currentDoor);
  const toLabel = labelForWorkingCareerRehearsalDoor(args.nextDoor);

  return {
    title: WORKING_CAREER_REHEARSAL_DOOR_CHANGE_CONFIRM_TITLE,
    description: `Analysis already running keeps ${fromLabel} on that review's artifacts, sponsor exports, and finalize honesty. New analysis uses ${toLabel} after you confirm. This does not stop the in-flight operation.`,
    confirmLabel: WORKING_CAREER_REHEARSAL_DOOR_CHANGE_CONFIRM_ACTION,
    cancelLabel: WORKING_CAREER_REHEARSAL_DOOR_CHANGE_CANCEL_ACTION,
  };
}
