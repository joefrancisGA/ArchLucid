import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  countDecisionGradeSemanticSupportBands,
  listUnsupportedDecisionGradeSemanticSupportFindings,
} from "@/lib/findings/semantic-support-band-stamp";
import { StructuralExecutionModeWire, type StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

export const UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_TITLE =
  "Semantic support is not confirmed for some findings";

export const UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_LEAD =
  "Structural citations are present, but semantic support is not confirmed for every decision-grade row.";

export const UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_FOOTER =
  "Finalize stays enabled. Review Unchecked findings before sponsor send.";

export function countUncheckedDecisionGradeSemanticSupportBands(
  findings: readonly QuickDecisionFinding[],
): number {
  return countDecisionGradeSemanticSupportBands(findings).unchecked;
}

export function shouldShowUncheckedSemanticSupportFinalizeWarning(input: {
  readonly workingDesk: boolean;
  readonly manifestFinalized: boolean;
  readonly findings: readonly QuickDecisionFinding[];
}): boolean {
  if (!input.workingDesk || input.manifestFinalized) {
    return false;
  }

  return countUncheckedDecisionGradeSemanticSupportBands(input.findings) > 0;
}

export function formatUncheckedSemanticSupportFinalizeCopy(uncheckedCount: number): string {
  const countLabel =
    uncheckedCount === 1
      ? "1 decision-grade finding is Unchecked"
      : `${uncheckedCount} decision-grade findings are Unchecked`;

  return `${UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_LEAD} ${countLabel}. ${UNCHECKED_SEMANTIC_SUPPORT_FINALIZE_FOOTER}`;
}

export const UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_OFF_TITLE =
  "Unsupported semantic support does not block finalize by default";

export const UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_OFF_COPY =
  "TB-1228 keeps semantic support on a warn-only lane unless PilotStrict hold on Unsupported is enabled for Working Real.";

export const UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_ON_TITLE =
  "Finalize is held on Unsupported semantic support";

export const UNSUPPORTED_SEMANTIC_SUPPORT_HOLD_ON_COPY =
  "PilotStrict hold on Unsupported is enabled for Working Real. Resolve or disposition Unsupported decision-grade findings before seal.";

export function countUnsupportedDecisionGradeSemanticSupportBands(
  findings: readonly QuickDecisionFinding[],
): number {
  return countDecisionGradeSemanticSupportBands(findings).unsupported;
}

export function shouldApplyUnsupportedSemanticSupportFinalizeHold(input: {
  readonly workingDesk: boolean;
  readonly manifestFinalized: boolean;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly hostQualityGateMode?: string | null;
  readonly pilotStrictHoldOnUnsupportedSemanticSupport?: boolean | null;
}): boolean {
  if (!input.workingDesk || input.manifestFinalized) {
    return false;
  }

  if (input.pilotStrictHoldOnUnsupportedSemanticSupport !== true) {
    return false;
  }

  if ((input.hostQualityGateMode ?? "").trim() !== "PilotStrict") {
    return false;
  }

  return normalizeStructuralExecutionModeForHold(input.structuralExecutionMode) === StructuralExecutionModeWire.Real;
}

export function shouldShowUnsupportedSemanticSupportHoldOffHonesty(input: {
  readonly workingDesk: boolean;
  readonly manifestFinalized: boolean;
  readonly findings: readonly QuickDecisionFinding[];
  readonly pilotStrictHoldOnUnsupportedSemanticSupport?: boolean | null;
}): boolean {
  if (!input.workingDesk || input.manifestFinalized) {
    return false;
  }

  if (input.pilotStrictHoldOnUnsupportedSemanticSupport === true) {
    return false;
  }

  return countUnsupportedDecisionGradeSemanticSupportBands(input.findings) > 0;
}

export function mergeFinalizeCommitBlockedReasons(
  ...reasons: ReadonlyArray<string | null | undefined>
): string | null {
  const parts = reasons
    .map((reason) => reason?.trim())
    .filter((reason): reason is string => Boolean(reason));

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" ");
}

export function resolveUnsupportedSemanticSupportFinalizeBlockedReason(input: {
  readonly workingDesk: boolean;
  readonly manifestFinalized: boolean;
  readonly findings: readonly QuickDecisionFinding[];
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly hostQualityGateMode?: string | null;
  readonly pilotStrictHoldOnUnsupportedSemanticSupport?: boolean | null;
}): string | null {
  if (!shouldApplyUnsupportedSemanticSupportFinalizeHold(input)) {
    return null;
  }

  const unsupportedCount = countUnsupportedDecisionGradeSemanticSupportBands(input.findings);

  if (unsupportedCount === 0) {
    return null;
  }

  const labels = listUnsupportedDecisionGradeSemanticSupportFindings(input.findings)
    .map((entry) => `${entry.findingId}: ${entry.title}`)
    .join("; ");

  return `${unsupportedCount} Unsupported decision-grade finding${unsupportedCount === 1 ? "" : "s"} block finalize under PilotStrict hold (TB-1228 opt-in). ${labels}`;
}

function normalizeStructuralExecutionModeForHold(
  mode: StructuralExecutionModeInput | undefined,
): (typeof StructuralExecutionModeWire)[keyof typeof StructuralExecutionModeWire] | null {
  if (mode === undefined) {
    return null;
  }

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
