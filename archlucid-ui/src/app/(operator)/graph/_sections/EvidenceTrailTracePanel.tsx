"use client";

import { useCallback, useEffect, useState } from "react";

import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { EvidenceTrailBuyerTraceTable } from "@/app/(operator)/graph/_sections/EvidenceTrailBuyerTraceTable";
import { getRunExplanationSummary } from "@/lib/api/architecture-runs";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { tryStaticDemoExplanationSummary } from "@/lib/operator-static-demo";
import { resolveFindingTraceRowsFromSummary } from "@/lib/quick-decision-summary-derive";

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
        <p className="mt-2 text-sm">Collecting finding provenance rows for this review package.</p>
      </OperatorLoadingNotice>
    );
  }

  if (failure !== null && rows.length === 0) {
    return (
      <div
        className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 text-sm dark:border-neutral-700 dark:bg-neutral-900/40"
        role="status"
      >
        <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Trace table unavailable</p>
        <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          Explainability metadata could not be loaded for this review. Try graph view or open the review package
          directly.
        </p>
        {onOpenGraphView !== undefined ? (
          <button
            type="button"
            className="mt-3 text-sm font-medium text-teal-800 underline dark:text-teal-300"
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
