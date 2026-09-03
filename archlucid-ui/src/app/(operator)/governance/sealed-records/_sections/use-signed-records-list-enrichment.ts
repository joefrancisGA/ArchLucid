"use client";

import { useCallback, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

import { enrichSignedRecordsListRows } from "./enrich-signed-records-list-rows";
import type { SignedRecordsListRow } from "./signed-records-list-row";

export function useSignedRecordsListEnrichment(options: {
  readonly rows: readonly SignedRecordsListRow[];
  readonly setRows: Dispatch<SetStateAction<readonly SignedRecordsListRow[]>>;
  readonly mountedRef: RefObject<boolean>;
}) {
  const { rows, setRows, mountedRef } = options;
  const [enriching, setEnriching] = useState(false);
  const [enrichmentFailed, setEnrichmentFailed] = useState(false);
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);
  const [retryFailedRunId, setRetryFailedRunId] = useState<string | null>(null);
  const [retrySucceededRunId, setRetrySucceededRunId] = useState<string | null>(null);

  const enrichRows = useCallback(
    async (baseRows: readonly SignedRecordsListRow[], canApplyState: () => boolean) => {
      setEnrichmentFailed(false);
      setEnriching(true);

      try {
        const enrichedRows = await enrichSignedRecordsListRows(baseRows);

        if (!canApplyState()) {
          return;
        }

        setRows(enrichedRows);
      } catch {
        if (!canApplyState()) {
          return;
        }

        setEnrichmentFailed(true);
      } finally {
        if (!canApplyState()) {
          return;
        }

        setEnriching(false);
      }
    },
    [setRows],
  );

  const resetRetryState = useCallback(() => {
    setRetryFailedRunId(null);
    setRetrySucceededRunId(null);
  }, []);

  const retryRow = useCallback(
    async (runId: string) => {
      const existingRow = rows.find((row) => row.runId === runId);

      if (existingRow === undefined) {
        return;
      }

      setRetryingRunId(runId);
      setRetryFailedRunId(null);
      setRetrySucceededRunId(null);

      try {
        const [enrichedRow] = await enrichSignedRecordsListRows([existingRow]);

        if (!mountedRef.current) {
          return;
        }

        setRows((currentRows) => currentRows.map((row) => (row.runId === runId ? enrichedRow : row)));

        if (enrichedRow.recordLookupFailure !== null || enrichedRow.signedRecordHref === null) {
          setRetryFailedRunId(runId);
        } else {
          setRetrySucceededRunId(runId);
        }
      } catch {
        if (!mountedRef.current) {
          return;
        }

        setRetryFailedRunId(runId);
      } finally {
        if (!mountedRef.current) {
          return;
        }

        setRetryingRunId(null);
      }
    },
    [mountedRef, rows, setRows],
  );

  return {
    enriching,
    enrichmentFailed,
    retryingRunId,
    retryFailedRunId,
    retrySucceededRunId,
    enrichRows,
    resetRetryState,
    retryRow,
  };
}
