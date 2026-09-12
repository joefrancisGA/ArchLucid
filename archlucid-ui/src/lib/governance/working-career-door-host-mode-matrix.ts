import type { AgentExecutionModeWire } from "@/lib/agent-execution-mode";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import {
  resolveEffectiveWorkingCareerRehearsalDoor,
  type WorkingCareerDoorGateResult,
} from "@/lib/governance/working-career-door-gate";
import {
  WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL,
} from "@/lib/governance/working-career-door-gate-copy";
import {
  WORKING_CAREER_DOOR_HOST_MODE_MATRIX_CAREER_REAL_DETAIL,
  WORKING_CAREER_DOOR_HOST_MODE_MATRIX_CAREER_SIMULATOR_BLOCKED_LABEL,
  WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_REAL_PRACTICE_DETAIL,
  WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_REAL_PRACTICE_LABEL,
  WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_SIMULATOR_DETAIL,
  WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_SIMULATOR_LABEL,
} from "@/lib/governance/working-career-door-host-mode-matrix-copy";
import type { WorkingCareerRehearsalDoorId } from "@/lib/governance/working-career-rehearsal-door";

export const WORKING_CAREER_DOOR_HOST_MODE_MATRIX_CELL_IDS = [
  "career-real",
  "career-simulator-blocked",
  "rehearsal-simulator",
  "rehearsal-real-practice",
] as const;

export type WorkingCareerDoorHostModeMatrixCellId =
  (typeof WORKING_CAREER_DOOR_HOST_MODE_MATRIX_CELL_IDS)[number];

export type ResolveWorkingCareerDoorHostModeMatrixInput = {
  readonly selectedDoor: WorkingCareerRehearsalDoorId;
  readonly gate: WorkingCareerDoorGateResult;
  readonly isSessionReal: boolean;
  readonly hostMode?: AgentExecutionModeWire | null;
  readonly sessionMode?: AgentExecutionModeWire | null;
};

export type WorkingCareerDoorHostModeMatrixPresentation = {
  readonly cellId: WorkingCareerDoorHostModeMatrixCellId;
  readonly effectiveDoor: WorkingCareerRehearsalDoorId;
  readonly isCareerExecuteBlocked: boolean;
  readonly labelAsRehearsal: boolean;
  readonly showStatusTag: boolean;
  readonly statusTagKind: EnterpriseStatusKind;
  readonly statusLabel: string;
  readonly detail: string;
  readonly matrixTestId: string;
};

function matrixTestIdForCell(cellId: WorkingCareerDoorHostModeMatrixCellId): string {
  return `working-career-door-host-mode-${cellId}`;
}

function resolveMatrixCellId(input: ResolveWorkingCareerDoorHostModeMatrixInput): WorkingCareerDoorHostModeMatrixCellId {
  if (input.selectedDoor === "career") {
    if (input.gate.isCareerExecuteBlocked) {
      return "career-simulator-blocked";
    }

    return "career-real";
  }

  if (input.isSessionReal) {
    return "rehearsal-real-practice";
  }

  return "rehearsal-simulator";
}

/**
 * CG-020 / AS-084: names the four door × host Mode cells and drives mismatch honesty chrome.
 * Career + Simulator is blocked — not a green Career run. Rehearsal + Real stays labeled practice.
 */
export function resolveWorkingCareerDoorHostModeMatrixCell(
  input: ResolveWorkingCareerDoorHostModeMatrixInput,
): WorkingCareerDoorHostModeMatrixPresentation {
  const cellId = resolveMatrixCellId(input);
  const effectiveDoor = resolveEffectiveWorkingCareerRehearsalDoor(input.selectedDoor, input.gate);
  const matrixTestId = matrixTestIdForCell(cellId);

  if (cellId === "career-real") {
    return {
      cellId,
      effectiveDoor,
      isCareerExecuteBlocked: false,
      labelAsRehearsal: false,
      showStatusTag: false,
      statusTagKind: "ready",
      statusLabel: "",
      detail: WORKING_CAREER_DOOR_HOST_MODE_MATRIX_CAREER_REAL_DETAIL,
      matrixTestId,
    };
  }

  if (cellId === "career-simulator-blocked") {
    return {
      cellId,
      effectiveDoor,
      isCareerExecuteBlocked: true,
      labelAsRehearsal: true,
      showStatusTag: true,
      statusTagKind: "blocked",
      statusLabel: WORKING_CAREER_DOOR_HOST_MODE_MATRIX_CAREER_SIMULATOR_BLOCKED_LABEL,
      detail: input.gate.blockedDetail ?? WORKING_CAREER_DOOR_HOST_SIMULATOR_BLOCKED_DETAIL,
      matrixTestId,
    };
  }

  if (cellId === "rehearsal-real-practice") {
    return {
      cellId,
      effectiveDoor,
      isCareerExecuteBlocked: false,
      labelAsRehearsal: true,
      showStatusTag: true,
      statusTagKind: "needs-attention",
      statusLabel: WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_REAL_PRACTICE_LABEL,
      detail: WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_REAL_PRACTICE_DETAIL,
      matrixTestId,
    };
  }

  return {
    cellId,
    effectiveDoor,
    isCareerExecuteBlocked: false,
    labelAsRehearsal: true,
    showStatusTag: false,
    statusTagKind: "needs-attention",
    statusLabel: WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_SIMULATOR_LABEL,
    detail: WORKING_CAREER_DOOR_HOST_MODE_MATRIX_REHEARSAL_SIMULATOR_DETAIL,
    matrixTestId,
  };
}
