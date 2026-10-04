import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatGraphRagCountField,
  formatGraphRagNeighborHitRateDisplay,
  GRAPH_RAG_NEIGHBOR_HIT_RATE_SCOPE_LINE,
  GRAPH_RAG_REVIEW_RETRIEVAL_SCOPE_LINE,
  resolveGraphRagPilotFloorLabel,
  shouldRenderGraphRagDiagnosticsStrip,
} from "@/lib/runs/run-graph-rag-diagnostics-display";
import type { RunRetrievalGroundingSummary } from "@/types/authority";

type RunRetrievalGraphRagDiagnosticsStripProps = {
  readonly summary: RunRetrievalGroundingSummary;
};

/** Graph-RAG retrieval quality rollup behind run-detail technical disclosure (V1 §2.20). */
export function RunRetrievalGraphRagDiagnosticsStrip(
  props: RunRetrievalGraphRagDiagnosticsStripProps,
): ReactElement | null {
  const summary = props.summary;

  if (!shouldRenderGraphRagDiagnosticsStrip(summary)) {
    return null;
  }

  const pilotFloor = resolveGraphRagPilotFloorLabel(summary.graphRagPilotFloorDisposition);
  const qualityPosture = summary.graphRagQualityPosture?.toLowerCase() ?? null;

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2.5 dark:border-neutral-700",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="run-retrieval-graph-rag-diagnostics"
    >
      <p className="m-0 font-medium text-al-text-primary">Graph-RAG retrieval diagnostics</p>
      <dl className="m-0 mt-2 grid gap-1 sm:grid-cols-[minmax(10rem,auto)_1fr] sm:gap-x-4">
        <dt>Neighbor chunks added</dt>
        <dd className="m-0 tabular-nums sm:justify-self-end">
          {formatGraphRagCountField(summary.totalGraphRagNeighborsAdded)}
        </dd>
        <dt>Graph seed hits</dt>
        <dd className="m-0 tabular-nums sm:justify-self-end">
          {formatGraphRagCountField(summary.totalGraphRagSeedHits)}
        </dd>
        <dt>Neighbor hit rate</dt>
        <dd className="m-0 tabular-nums sm:justify-self-end">
          {formatGraphRagNeighborHitRateDisplay(summary)}
        </dd>
        <dt>Retrieval tokens in</dt>
        <dd className="m-0 tabular-nums sm:justify-self-end">
          {formatGraphRagCountField(summary.totalRetrievalTokensIn)}
        </dd>
        <dt>Pilot floor</dt>
        <dd className="m-0 sm:justify-self-end">{pilotFloor}</dd>
        {qualityPosture ? (
          <>
            <dt>Quality posture</dt>
            <dd className="m-0 sm:justify-self-end" data-testid="graph-rag-quality-posture">
              {qualityPosture}
            </dd>
          </>
        ) : null}
      </dl>
      <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        {GRAPH_RAG_REVIEW_RETRIEVAL_SCOPE_LINE}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        {GRAPH_RAG_NEIGHBOR_HIT_RATE_SCOPE_LINE}
      </p>
      {qualityPosture === "unproven" ? (
        <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-300">
          Graph-RAG neighbor expansion ran without Azure AI Search vector posture — treat retrieval quality as unproven.
        </p>
      ) : null}
      {pilotFloor === "WARN" ? (
        <p className="m-0 mt-2 text-neutral-600 dark:text-neutral-300">
          High Graph-RAG neighbor share with low citation coverage — expand retrieval grounding rows before sponsor send.
        </p>
      ) : null}
    </div>
  );
}
