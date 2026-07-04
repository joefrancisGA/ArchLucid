import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunRetrievalGroundingSummary } from "@/types/authority";

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

type RunRetrievalGraphRagDiagnosticsStripProps = {
  readonly summary: RunRetrievalGroundingSummary;
};

/** Graph-RAG retrieval quality rollup behind run-detail technical disclosure (V1 §2.20). */
export function RunRetrievalGraphRagDiagnosticsStrip(
  props: RunRetrievalGraphRagDiagnosticsStripProps,
): ReactElement | null {
  const summary = props.summary;
  const neighbors = summary.totalGraphRagNeighborsAdded ?? 0;
  const seeds = summary.totalGraphRagSeedHits ?? 0;
  const hitRate = typeof summary.graphRagNeighborHitRate === "number" ? summary.graphRagNeighborHitRate : 0;
  const tokensIn = summary.totalRetrievalTokensIn ?? 0;
  const pilotFloor = (summary.graphRagPilotFloorDisposition ?? "PASS").toUpperCase();
  const qualityPosture = summary.graphRagQualityPosture?.toLowerCase() ?? null;

  if (neighbors === 0 && seeds === 0 && tokensIn === 0)
    return null;

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
        <dd className="m-0 tabular-nums sm:justify-self-end">{neighbors}</dd>
        <dt>Graph seed hits</dt>
        <dd className="m-0 tabular-nums sm:justify-self-end">{seeds}</dd>
        <dt>Neighbor hit rate</dt>
        <dd className="m-0 tabular-nums sm:justify-self-end">{formatPercent(hitRate)}</dd>
        <dt>Retrieval tokens in</dt>
        <dd className="m-0 tabular-nums sm:justify-self-end">{tokensIn}</dd>
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
