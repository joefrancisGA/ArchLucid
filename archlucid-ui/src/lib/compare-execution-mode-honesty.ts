import type { RunSummary } from "@/types/authority";
import {
  formatStructuralExecutionModeLabel,
  StructuralExecutionModeWire,
  type StructuralExecutionModeInput,
} from "@/lib/structural-execution-mode";

export type CompareExecutionModeHonesty = {
  baselineMode: StructuralExecutionModeInput;
  updatedMode: StructuralExecutionModeInput;
  modesDiffer: boolean;
  anyNonReal: boolean;
  advisoryParagraph: string | null;
  modeUnavailable: boolean;
};

const MODE_UNAVAILABLE_ADVISORY =
  "Execution mode metadata was not available for one or both reviews — treat finding and cost deltas as directional only.";

function normalizeModeLabel(mode: StructuralExecutionModeInput): string | null {
  const label = formatStructuralExecutionModeLabel(mode);

  if (label === "Unknown") {
    return null;
  }

  return label;
}

function isNonRealMode(mode: StructuralExecutionModeInput): boolean {
  const label = normalizeModeLabel(mode);

  if (label === null) {
    return false;
  }

  return label !== StructuralExecutionModeWire.Real;
}

function modesEqual(left: StructuralExecutionModeInput, right: StructuralExecutionModeInput): boolean {
  return normalizeModeLabel(left) === normalizeModeLabel(right);
}

function modeIsUnavailable(mode: StructuralExecutionModeInput): boolean {
  return mode === undefined || mode === null || normalizeModeLabel(mode) === null;
}

/** TB-2071: execution-mode + trust honesty for compare delta narratives. */
export function resolveCompareExecutionModeHonesty(
  baseline: RunSummary | null,
  updated: RunSummary | null,
): CompareExecutionModeHonesty | null {
  if (baseline === null && updated === null) {
    return null;
  }

  const baselineMode = baseline?.structuralExecutionMode;
  const updatedMode = updated?.structuralExecutionMode;
  const modeUnavailable = modeIsUnavailable(baselineMode) || modeIsUnavailable(updatedMode);

  if (
    (baselineMode === undefined && updatedMode === undefined) ||
    (baselineMode === null && updatedMode === null)
  ) {
    return {
      baselineMode,
      updatedMode,
      modesDiffer: false,
      anyNonReal: false,
      advisoryParagraph: MODE_UNAVAILABLE_ADVISORY,
      modeUnavailable: true,
    };
  }

  const modesDiffer = !modesEqual(baselineMode, updatedMode);
  const anyNonReal = isNonRealMode(baselineMode) || isNonRealMode(updatedMode);
  const advisoryParagraph = buildAdvisoryParagraph(baselineMode, updatedMode, modesDiffer, anyNonReal, modeUnavailable);

  return {
    baselineMode,
    updatedMode,
    modesDiffer,
    anyNonReal,
    advisoryParagraph,
    modeUnavailable,
  };
}

function buildAdvisoryParagraph(
  baselineMode: StructuralExecutionModeInput,
  updatedMode: StructuralExecutionModeInput,
  modesDiffer: boolean,
  anyNonReal: boolean,
  modeUnavailable: boolean,
): string | null {
  const baselineLabel = normalizeModeLabel(baselineMode) ?? "unknown";
  const updatedLabel = normalizeModeLabel(updatedMode) ?? "unknown";

  if (modeUnavailable) {
    return MODE_UNAVAILABLE_ADVISORY;
  }

  if (!modesDiffer && !anyNonReal) {
    return null;
  }

  const lines: string[] = [];

  if (modesDiffer) {
    lines.push(
      `Baseline review used ${baselineLabel} execution and updated used ${updatedLabel} execution — finding and cost deltas may not be directly comparable.`,
    );
  } else if (anyNonReal) {
    lines.push(
      `Both reviews used ${baselineLabel} execution — treat finding deltas as directional only and confirm per-finding trust labels on inspect or export before sponsor sign-off.`,
    );
  }

  lines.push(
    "Compare tables and AI narratives summarize posture shifts; per-finding trust labels on inspect, run detail, and export paths remain authoritative for provenance.",
  );

  return lines.join(" ");
}
