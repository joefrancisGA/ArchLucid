"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { EvidenceTrailBuyerTraceTable } from "@/app/(operator)/insights/evidence-graph/_sections/EvidenceTrailBuyerTraceTable";
import { getRunExplanationSummary } from "@/lib/api/architecture-runs";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { tryStaticDemoExplanationSummary } from "@/lib/operator/operator-static-demo";
import { resolveFindingTraceRowsFromSummary } from "@/lib/quick-decision-summary-derive";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type EvidenceTrailTracePanelProps = {
  runId: string;
  onOpenGraphView?: () => void;
};

/** Loads finding-centric trace rows for the evidence trail table view. */
export function EvidenceTrailTracePanel(props: EvidenceTrailTracePanelProps) {
  const { runId, onOpenGraphView } = props;
  const runTrim = runId.trim();
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const [rows, setRows] = useState(() => {
    const staticSummary = tryStaticDemoExplanationSummary(runTrim);

    return resolveFindingTraceRowsFromSummary(staticSummary);
  });

  const loadTraceRows = useCallback(async () => {
    if (runTrim.length === 0) {
      setRows([]);
      setFailure(null);

      return;
    }

    const staticSummary = tryStaticDemoExplanationSummary(runTrim);

    if (staticSummary !== null) {
      setRows(resolveFindingTraceRowsFromSummary(staticSummary));
      setFailure(null);

      return;
    }

    setLoading(true);
    setFailure(null);

    try {
      const summary = await getRunExplanationSummary(runTrim);
      setRows(resolveFindingTraceRowsFromSummary(summary));
    } catch (error) {
      const staticFallback = tryStaticDemoExplanationSummary(runTrim);

      if (staticFallback !== null) {
        setRows(resolveFindingTraceRowsFromSummary(staticFallback));
        setFailure(null);
      } else {
        setFailure(toApiLoadFailure(error));
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [runTrim]);

  useEffect(() => {
    void loadTraceRows();
  }, [loadTraceRows]);

  if (loading && rows.length === 0) {
    return (
      <OperatorLoadingNotice>
        <strong>Loading trace table</strong>
        <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>Collecting finding provenance rows for this review.</p>
      </OperatorLoadingNotice>
    );
  }

  if (failure !== null && rows.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40",
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="status"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Trace table unavailable</p>
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          Explainability metadata could not be loaded for this review. Try graph view or open the review
          directly.
        </p>
        {onOpenGraphView !== undefined ? (
          <button
            type="button"
            className={cn("mt-3", OPERATOR_LINK.step)}
            onClick={onOpenGraphView}
          >
            Open graph view
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <EvidenceTrailBuyerTraceTable runId={runTrim} rows={rows} onOpenGraphView={onOpenGraphView} />
  );
}
