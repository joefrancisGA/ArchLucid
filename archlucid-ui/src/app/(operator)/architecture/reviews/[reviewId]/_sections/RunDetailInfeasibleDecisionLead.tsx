import type { ReactElement } from "react";

import { isExportableDecisionVerdict } from "@/lib/decision-receipt-export";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { RunDetailFeasibilityVerdictSection } from "./RunDetailFeasibilityVerdictSection";

export type RunDetailInfeasibleDecisionLeadProps = {
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
  readonly runId: string;
};

/** LI-02 — leads Overview and Finalized review record when the deliverable is a reasoned no. */
export function RunDetailInfeasibleDecisionLead(
  props: RunDetailInfeasibleDecisionLeadProps,
): ReactElement | null {
  const verdict = props.feasibilityVerdict;

  if (verdict === null || verdict === undefined || !isExportableDecisionVerdict(verdict.kind)) {
    return null;
  }

  return <RunDetailFeasibilityVerdictSection verdict={verdict} runId={props.runId} />;
}
