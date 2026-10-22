import { resolveFindingTraceCompletenessDisplay } from "@/lib/findings/finding-trace-completeness-display";

/** Lineage surfaces use the same trace field-fill semantics as finding inspect (UU-450). */
export function formatGovernanceLineageTraceFieldFill(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return resolveFindingTraceCompletenessDisplay(null).summaryLine;
  }

  const display = resolveFindingTraceCompletenessDisplay(value);

  if (!display.recorded || display.ratioPct === null) {
    return display.summaryLine;
  }

  return `Trace field fill ${display.ratioPct}% — ${display.summaryLine}`;
}
