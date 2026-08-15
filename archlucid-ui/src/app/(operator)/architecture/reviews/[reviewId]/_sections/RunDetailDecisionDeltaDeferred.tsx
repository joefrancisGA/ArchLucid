import { resolveQuickDecisionFindingsForRunDetail } from "@/lib/quick-decision-summary-derive";
import { resolveRunDetailDecisionDeltaView } from "@/lib/runs/run-detail-decision-delta";
import type { RunDetail } from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";

import { RunDetailDecisionDeltaPanelDeferred } from "./run-detail-page-view-deferred-chunks";

type RunDetailDecisionDeltaDeferredProps = {
  readonly runId: string;
  readonly resolvedDetail: RunDetail;
  readonly explanationSummary: RunExplanationSummary | null;
  readonly isCommitted: boolean;
};

/**
 * Async Server Component — derives top material findings for the decision delta panel
 * without blocking first-screen chrome on the full explanation collapsible.
 */
export async function RunDetailDecisionDeltaDeferred(
  props: RunDetailDecisionDeltaDeferredProps,
): Promise<React.JSX.Element | null> {
  const { runId, resolvedDetail, explanationSummary, isCommitted } = props;

  if (!isCommitted) {
    return null;
  }

  const quickDecisionFindings = resolveQuickDecisionFindingsForRunDetail(resolvedDetail, explanationSummary);
  const view = resolveRunDetailDecisionDeltaView(quickDecisionFindings, isCommitted);

  if (view === null) {
    return null;
  }

  return <RunDetailDecisionDeltaPanelDeferred runId={runId} view={view} />;
}
