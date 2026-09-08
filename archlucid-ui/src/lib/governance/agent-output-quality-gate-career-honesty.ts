import { StructuralExecutionModeWire, type StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

export const QUALITY_GATE_WARN_ONLY_WORKING_COPY =
  "Quality gate is WarnOnly — this seal is not career-complete for real-mode analysis";

export const QUALITY_GATE_WARNED_DISPOSITION_COPY =
  "Quality gate disposition is Warned — resolve warnings before career export";

/** AgentOutputQualityGateOutcome wire ordinals (Accepted=0, Warned=1, Rejected=2). */
export const AgentOutputQualityGateOutcomeWire = {
  Accepted: 0,
  Warned: 1,
  Rejected: 2,
} as const;

export type QualityGateModeInput = "WarnOnly" | "PilotStrict" | string | null | undefined;

export function formatQualityGateModeStampLabel(
  recordedMode: QualityGateModeInput,
  hostMode: QualityGateModeInput,
): string {
  const mode = normalizeQualityGateMode(recordedMode) ?? normalizeQualityGateMode(hostMode) ?? "WarnOnly";

  return mode === "PilotStrict" ? "Quality gate: PilotStrict" : "Quality gate: WarnOnly";
}

export function shouldBlockWorkingCareerExportForQualityGate(input: {
  readonly workingDesk?: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly isSample?: boolean | null;
  readonly hostAgentExecutionMode?: string | null;
  readonly hostQualityGateMode?: QualityGateModeInput;
  readonly aggregateQualityGateOutcome?: number | null;
}): boolean {
  if (input.workingDesk !== true) {
    return false;
  }

  if (input.isSample === true) {
    return false;
  }

  if (normalizeStructuralExecutionMode(input.structuralExecutionMode) !== StructuralExecutionModeWire.Real) {
    return false;
  }

  if (input.aggregateQualityGateOutcome === AgentOutputQualityGateOutcomeWire.Warned) {
    return true;
  }

  const hostIsReal = (input.hostAgentExecutionMode ?? "").trim().toLowerCase() === "real";
  const hostWarnOnly = normalizeQualityGateMode(input.hostQualityGateMode) === "WarnOnly";

  return hostIsReal && hostWarnOnly;
}

export function formatQualityGateCareerExportBlockedReason(input: {
  readonly workingDesk?: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly isSample?: boolean | null;
  readonly hostAgentExecutionMode?: string | null;
  readonly hostQualityGateMode?: QualityGateModeInput;
  readonly aggregateQualityGateOutcome?: number | null;
}): string | null {
  if (!shouldBlockWorkingCareerExportForQualityGate(input)) {
    return null;
  }

  if (input.aggregateQualityGateOutcome === AgentOutputQualityGateOutcomeWire.Warned) {
    return QUALITY_GATE_WARNED_DISPOSITION_COPY;
  }

  return QUALITY_GATE_WARN_ONLY_WORKING_COPY;
}

export function shouldSuppressReadyToFinalizeForQualityGateHonesty(input: {
  readonly workingDesk?: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly isSample?: boolean | null;
  readonly hostAgentExecutionMode?: string | null;
  readonly hostQualityGateMode?: QualityGateModeInput;
  readonly aggregateQualityGateOutcome?: number | null;
}): boolean {
  return shouldBlockWorkingCareerExportForQualityGate(input);
}

function normalizeQualityGateMode(mode: QualityGateModeInput): "WarnOnly" | "PilotStrict" | null {
  if (mode === null || mode === undefined) {
    return null;
  }

  const normalized = String(mode).trim();

  if (normalized.toLowerCase() === "pilotstrict") {
    return "PilotStrict";
  }

  if (normalized.toLowerCase() === "warnonly") {
    return "WarnOnly";
  }

  return null;
}

function normalizeStructuralExecutionMode(
  mode: StructuralExecutionModeInput,
): (typeof StructuralExecutionModeWire)[keyof typeof StructuralExecutionModeWire] | null {
  if (mode === StructuralExecutionModeWire.Real || mode === 1) {
    return StructuralExecutionModeWire.Real;
  }

  if (mode === StructuralExecutionModeWire.Simulator || mode === 0) {
    return StructuralExecutionModeWire.Simulator;
  }

  if (mode === StructuralExecutionModeWire.Fallback || mode === 2) {
    return StructuralExecutionModeWire.Fallback;
  }

  if (mode === StructuralExecutionModeWire.Mixed || mode === 3) {
    return StructuralExecutionModeWire.Mixed;
  }

  return null;
}
