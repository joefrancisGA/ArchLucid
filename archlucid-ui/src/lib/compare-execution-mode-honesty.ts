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
};

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

/** TB-2071: execution-mode + trust honesty for compare delta narratives. */
export function resolveCompareExecutionModeHonesty(
  baseline: RunSummary | null,
  updated: RunSummary | null,
): CompareExecutionModeHonesty | null {
  const baselineMode = baseline?.structuralExecutionMode;
  const updatedMode = updated?.structuralExecutionMode;

  if (baselineMode === undefined && updatedMode === undefined) {
    return null;
  }

  if (baselineMode === null && updatedMode === null) {
    return null;
  }

  const modesDiffer = !modesEqual(baselineMode, updatedMode);
  const anyNonReal = isNonRealMode(baselineMode) || isNonRealMode(updatedMode);
  const advisoryParagraph = buildAdvisoryParagraph(baselineMode, updatedMode, modesDiffer, anyNonReal);

  return {
    baselineMode,
    updatedMode,
    modesDiffer,
    anyNonReal,
    advisoryParagraph,
  };
}

function buildAdvisoryParagraph(
  baselineMode: StructuralExecutionModeInput,
  updatedMode: StructuralExecutionModeInput,
  modesDiffer: boolean,
  anyNonReal: boolean,
): string | null {
  const baselineLabel = normalizeModeLabel(baselineMode) ?? "unknown";
  const updatedLabel = normalizeModeLabel(updatedMode) ?? "unknown";

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
