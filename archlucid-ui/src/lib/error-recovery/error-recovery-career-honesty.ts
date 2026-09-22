import { resolveHonestyWorkingCareerRehearsalDoor } from "@/lib/governance/working-career-rehearsal-door-stamp";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import {
  resolveRunStatusBadgeWorkingCareerHonestyCell,
  type RunStatusBadgeWorkingCareerHonestyCellId,
  type RunStatusBadgeWorkingCareerHonestyInput,
} from "@/lib/runs/run-status-badge-career-honesty";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

/** CG-096 — retry on error boundaries does not upgrade execute posture. */
export const ERROR_RECOVERY_RETRY_NO_POSTURE_CHANGE =
  "Retry reloads this surface only — it does not change execute posture or upgrade Simulator to Real.";

export const ERROR_RECOVERY_REVIEW_RETRY_NO_CAREER_WASH =
  "Retry reloads this review desk. It does not mark a practice run record-complete or change the persisted execute stamp.";

export const ERROR_RECOVERY_WORKING_RETRY_TITLE = "Recovery does not upgrade execute posture";

export const ERROR_RECOVERY_STAMPED_CAREER_BLOCKED_TITLE =
  "Sealed record blocked — recovery cannot wash Simulator posture";

export const ERROR_RECOVERY_STAMPED_CAREER_BLOCKED_BODY =
  "This review ran on Simulator or Fallback while the Record review type was selected. Retry keeps that stamp — it does not convert the run to record-complete proof.";

export const ERROR_RECOVERY_STAMPED_REHEARSAL_INCOMPLETE_TITLE =
  "Practice incomplete — recovery is practice only";

export const ERROR_RECOVERY_STAMPED_REHEARSAL_INCOMPLETE_BODY =
  "This review ran on the Practice review type with Simulator or Fallback structural execute. Retry reloads the desk for dry-runs — it is not record-complete sealed-record proof.";

export const ERROR_RECOVERY_STAMPED_PRACTICE_TITLE = "Practice — recovery is not sealed-record proof";

export const ERROR_RECOVERY_STAMPED_PRACTICE_BODY =
  "This review ran as Practice on Real structural execute. Retry keeps practice posture — it is not sponsor-ready sealed-record evidence.";

export type ErrorRecoveryCareerHonestyPresentation = {
  readonly kind: "generic-retry" | "stamped";
  readonly cellId?: RunStatusBadgeWorkingCareerHonestyCellId;
  readonly title: string;
  readonly body: string;
};

function presentationForStampedCell(
  cellId: RunStatusBadgeWorkingCareerHonestyCellId,
): ErrorRecoveryCareerHonestyPresentation {
  if (cellId === "career-simulator-blocked") {
    return {
      kind: "stamped",
      cellId,
      title: ERROR_RECOVERY_STAMPED_CAREER_BLOCKED_TITLE,
      body: `${ERROR_RECOVERY_STAMPED_CAREER_BLOCKED_BODY} ${ERROR_RECOVERY_REVIEW_RETRY_NO_CAREER_WASH}`,
    };
  }

  if (cellId === "rehearsal-simulator") {
    return {
      kind: "stamped",
      cellId,
      title: ERROR_RECOVERY_STAMPED_REHEARSAL_INCOMPLETE_TITLE,
      body: `${ERROR_RECOVERY_STAMPED_REHEARSAL_INCOMPLETE_BODY} ${ERROR_RECOVERY_REVIEW_RETRY_NO_CAREER_WASH}`,
    };
  }

  return {
    kind: "stamped",
    cellId,
    title: ERROR_RECOVERY_STAMPED_PRACTICE_TITLE,
    body: `${ERROR_RECOVERY_STAMPED_PRACTICE_BODY} ${ERROR_RECOVERY_REVIEW_RETRY_NO_CAREER_WASH}`,
  };
}

export function resolveErrorRecoveryCareerHonesty(input: {
  readonly workingDesk?: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly stampedWorkingCareerRehearsalDoor?: string | null;
  readonly liveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId;
}): ErrorRecoveryCareerHonestyPresentation | null {
  if (input.workingDesk !== true) {
    return null;
  }

  const honestyInput: RunStatusBadgeWorkingCareerHonestyInput = {
    workingDesk: true,
    structuralExecutionMode: input.structuralExecutionMode,
    effectiveWorkingCareerRehearsalDoor: resolveHonestyWorkingCareerRehearsalDoor({
      stampedDoor: input.stampedWorkingCareerRehearsalDoor,
      liveDoor: input.liveWorkingCareerRehearsalDoor,
    }),
  };

  const cellId = resolveRunStatusBadgeWorkingCareerHonestyCell(honestyInput);

  if (cellId !== null && cellId !== "career-real") {
    return presentationForStampedCell(cellId);
  }

  return {
    kind: "generic-retry",
    title: ERROR_RECOVERY_WORKING_RETRY_TITLE,
    body: ERROR_RECOVERY_RETRY_NO_POSTURE_CHANGE,
  };
}
