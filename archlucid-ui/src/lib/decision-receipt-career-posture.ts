import { resolveCareerArtifactExportHonestyDoorFields } from "@/lib/career-artifact/resolve-career-artifact-export-honesty-input";
import { isRehearsalStructuralExecutionMode } from "@/lib/governance/simulator-career-honesty";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";
import {
  EXECUTION_MODE_NOT_STORED_LABEL,
  normalizeStructuralExecutionModeWire,
  StructuralExecutionModeWire,
  type StructuralExecutionModeInput,
  type StructuralExecutionModeWireValue,
} from "@/lib/structural-execution-mode";
import type { RunSummary } from "@/types/authority";

/** CG-025 — execute posture fields required on committed-run decision receipts. */
export type DecisionReceiptCareerPosture = {
  readonly structuralExecutionMode: StructuralExecutionModeWireValue | typeof EXECUTION_MODE_NOT_STORED_LABEL;
  readonly workingCareerRehearsalDoor: WorkingCareerRehearsalDoorId;
  readonly rehearsalIncomplete: boolean;
};

export function resolveDecisionReceiptCareerPosture(input: {
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly liveDoor?: WorkingCareerRehearsalDoorId | null;
  readonly workingCareerRehearsalDoor?: string | null;
  readonly progressSummary?: RunSummary | null;
}): DecisionReceiptCareerPosture {
  const resolved = resolveCareerArtifactExportHonestyDoorFields({
    structuralExecutionMode: input.structuralExecutionMode,
    workingCareerRehearsalDoor: input.workingCareerRehearsalDoor,
    liveDoor: input.liveDoor,
    progressSummary: input.progressSummary,
  });
  const normalizedMode = normalizeStructuralExecutionModeWire(resolved.structuralExecutionMode ?? null);
  const structuralExecutionMode = normalizedMode ?? EXECUTION_MODE_NOT_STORED_LABEL;
  const workingCareerRehearsalDoor = resolved.effectiveWorkingCareerRehearsalDoor;
  const rehearsalIncomplete =
    normalizedMode !== null
    && isRehearsalStructuralExecutionMode(normalizedMode)
    && workingCareerRehearsalDoor === "rehearsal";

  return {
    structuralExecutionMode,
    workingCareerRehearsalDoor,
    rehearsalIncomplete,
  };
}
