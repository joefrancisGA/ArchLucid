import { isRunCommittedForBaseline } from "@/lib/compare-baseline-run";
import type { RunSummary } from "@/types/authority";

/** Maximum committed reviews shown in buyer/compare/graph pickers. */
export const COMMITTED_RUN_PICKER_LIMIT = 20;

/** Filters to committed runs and caps list length for picker surfaces. */
export function filterCommittedRunsForPicker(runs: RunSummary[]): RunSummary[] {
  return runs.filter(isRunCommittedForBaseline).slice(0, COMMITTED_RUN_PICKER_LIMIT);
}
