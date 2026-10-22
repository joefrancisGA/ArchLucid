import { findingTraceCompletenessPlainEnglish } from "@/lib/findings/finding-explainability-summary";

export type FindingTraceCompletenessDisplay = {
  readonly recorded: boolean;
  readonly ratioPct: number | null;
  readonly summaryLine: string;
};

/** Avoid treating a missing ratio as 0% minimal completeness (UU-421). */
export function resolveFindingTraceCompletenessDisplay(
  traceCompletenessRatio: number | null | undefined,
): FindingTraceCompletenessDisplay {
  if (
    traceCompletenessRatio === null
    || traceCompletenessRatio === undefined
    || !Number.isFinite(Number(traceCompletenessRatio))
  ) {
    return {
      recorded: false,
      ratioPct: null,
      summaryLine: "Not recorded — this review did not persist a trace field-fill ratio.",
    };
  }

  const normalized = Math.min(1, Math.max(0, Number(traceCompletenessRatio)));
  const ratioPct = Math.round(normalized * 100);

  return {
    recorded: true,
    ratioPct,
    summaryLine: findingTraceCompletenessPlainEnglish(ratioPct),
  };
}

export const FINDING_TRACE_FIELD_FILL_LABEL = "Trace field fill" as const;

export const FINDING_TRACE_FIELD_FILL_SCOPE_LINE =
  "Measures how many trace fields were populated — not whether the finding is confirmed." as const;
