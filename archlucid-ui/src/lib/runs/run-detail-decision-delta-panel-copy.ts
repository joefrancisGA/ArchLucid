import { RUN_DETAIL_DECISION_DELTA_TOP_N } from "@/lib/runs/run-detail-decision-delta";

export const RUN_DETAIL_DECISION_DELTA_POPULATED_INTRO =
  "Top open findings on this committed review — ordered by severity, then finding order. Compliance rule key and evidence anchor are previews; expand a finding for full detail." as const;

export const RUN_DETAIL_DECISION_DELTA_EMPTY_INTRO =
  "Decision delta lists open finding titles only when findings were captured on a committed review." as const;

export function formatDecisionDeltaOmittedOpenFindingsLine(omittedCount: number): string {
  const noun = omittedCount === 1 ? "open finding is" : "open findings are";

  return `${omittedCount} more ${noun} stored but not listed here (severity sort shows the top ${RUN_DETAIL_DECISION_DELTA_TOP_N} only).`;
}
