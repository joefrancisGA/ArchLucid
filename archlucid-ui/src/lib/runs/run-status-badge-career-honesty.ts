import {
  isRehearsalStructuralExecutionMode,
  shouldSuppressReadyToFinalizeForSimulatorRehearsal,
} from "@/lib/governance/simulator-career-honesty";
import {
  DEFAULT_WORKING_CAREER_REHEARSAL_DOOR,
  type WorkingCareerRehearsalDoorId,
} from "@/lib/governance/working-career-rehearsal-door";
import { PIPELINE_STATUS_LABELS } from "@/lib/pipeline-status-labels";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { RunPipelineInternalLabel } from "@/lib/pipeline-status-labels";

/** CG-031 — Working badge states (text labels are grayscale-safe; not color-only). */
export const RUN_STATUS_BADGE_CAREER_COMPLETE_LABEL = "Career complete";

export const RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL = "Career blocked";

export const RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL = "Rehearsal incomplete";

export const RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL = "Practice";

export const RUN_STATUS_BADGE_WORKING_CAREER_HONESTY_CELL_IDS = [
  "career-real",
  "career-simulator-blocked",
  "rehearsal-simulator",
  "rehearsal-real-practice",
] as const;

export type RunStatusBadgeWorkingCareerHonestyCellId =
  (typeof RUN_STATUS_BADGE_WORKING_CAREER_HONESTY_CELL_IDS)[number];

export type RunStatusBadgeWorkingCareerHonestyInput = {
  readonly workingDesk?: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly effectiveWorkingCareerRehearsalDoor?: WorkingCareerRehearsalDoorId | null;
};

export type RunStatusBadgeWorkingCareerHonestyPresentation = {
  readonly cellId: RunStatusBadgeWorkingCareerHonestyCellId;
  readonly displayLabel: string;
  readonly statusTagKind: EnterpriseStatusKind;
};

function resolveHonestyCellId(input: RunStatusBadgeWorkingCareerHonestyInput): RunStatusBadgeWorkingCareerHonestyCellId {
  const effectiveDoor =
    input.effectiveWorkingCareerRehearsalDoor ?? DEFAULT_WORKING_CAREER_REHEARSAL_DOOR;

  if (effectiveDoor === "career") {
    if (shouldSuppressReadyToFinalizeForSimulatorRehearsal(input)) {
      return "career-simulator-blocked";
    }

    return "career-real";
  }

  if (isRehearsalStructuralExecutionMode(input.structuralExecutionMode ?? null)) {
    return "rehearsal-simulator";
  }

  return "rehearsal-real-practice";
}

export function resolveRunStatusBadgeWorkingCareerHonestyCell(
  input: RunStatusBadgeWorkingCareerHonestyInput,
): RunStatusBadgeWorkingCareerHonestyCellId | null {
  if (input.workingDesk !== true) {
    return null;
  }

  return resolveHonestyCellId(input);
}

function presentationForCell(
  cellId: RunStatusBadgeWorkingCareerHonestyCellId,
): RunStatusBadgeWorkingCareerHonestyPresentation {
  if (cellId === "career-real") {
    return {
      cellId,
      displayLabel: RUN_STATUS_BADGE_CAREER_COMPLETE_LABEL,
      statusTagKind: "ready",
    };
  }

  if (cellId === "career-simulator-blocked") {
    return {
      cellId,
      displayLabel: RUN_STATUS_BADGE_CAREER_BLOCKED_LABEL,
      statusTagKind: "blocked",
    };
  }

  if (cellId === "rehearsal-simulator") {
    return {
      cellId,
      displayLabel: RUN_STATUS_BADGE_REHEARSAL_INCOMPLETE_LABEL,
      statusTagKind: "needs-attention",
    };
  }

  return {
    cellId,
    displayLabel: RUN_STATUS_BADGE_REHEARSAL_PRACTICE_LABEL,
    statusTagKind: "needs-attention",
  };
}

/**
 * CG-031 — remap finalized / career-complete pipeline pills on Working so Simulator
 * cannot screenshot as green Career Ready.
 */
export function applyRunStatusBadgeWorkingCareerHonesty(
  internalLabel: RunPipelineInternalLabel,
  input: RunStatusBadgeWorkingCareerHonestyInput,
): RunStatusBadgeWorkingCareerHonestyPresentation | null {
  if (input.workingDesk !== true) {
    return null;
  }

  if (internalLabel !== PIPELINE_STATUS_LABELS.finalized) {
    return null;
  }

  const cellId = resolveHonestyCellId(input);
  const presentation = presentationForCell(cellId);

  if (cellId === "career-real") {
    return null;
  }

  return presentation;
}
