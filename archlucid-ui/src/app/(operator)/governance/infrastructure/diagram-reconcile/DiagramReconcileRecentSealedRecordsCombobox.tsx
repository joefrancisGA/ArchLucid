"use client";

import { useEffect, useState } from "react";

import { Label } from "@/components/ui/label";
import { useEffectiveOperatorScopeRecord } from "@/hooks/use-effective-operator-scope";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { filterCommittedRunsForPicker } from "@/lib/committed-run-picker";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator/operator-run-picker-client";
import { cn } from "@/lib/utils";
import type { RunSummary } from "@/types/authority";

const RECENT_SEALED_RECORD_LIMIT = 10;

export type DiagramReconcileRecentSealedRecordsComboboxProps = {
  readonly selectedRunId: string;
  readonly onSelectRunId: (runId: string) => void;
  readonly disabled?: boolean;
};

export function DiagramReconcileRecentSealedRecordsCombobox(
  props: DiagramReconcileRecentSealedRecordsComboboxProps,
): React.JSX.Element | null {
  const scope = useEffectiveOperatorScopeRecord();
  const [records, setRecords] = useState<RunSummary[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRecentSealedRecords() {
      setLoadError(false);

      try {
        const result = await loadProjectRunsMergedWithDemoFallback(scope.projectId, {
          committedOnly: true,
          mergeDemoOnEmpty: true,
        });

        if (!cancelled) {
          setRecords(filterCommittedRunsForPicker(result.items).slice(0, RECENT_SEALED_RECORD_LIMIT));
        }
      } catch {
        if (!cancelled) {
          setRecords([]);
          setLoadError(true);
        }
      }
    }

    void loadRecentSealedRecords();

    return () => {
      cancelled = true;
    };
  }, [scope.projectId]);

  if (records.length === 0 && !loadError) {
    return null;
  }

  const cnField =
    "max-w-xl rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

  return (
    <div className="grid max-w-xl gap-2" data-testid="infra-diagram-reconcile-recent-sealed-records">
      <Label htmlFor="infra-diagram-reconcile-recent-sealed-records-picker">
        Recent sealed review records
      </Label>
      <select
        id="infra-diagram-reconcile-recent-sealed-records-picker"
        className={cnField}
        role="combobox"
        aria-label="Recent sealed review records"
        disabled={props.disabled === true || records.length === 0}
        value={props.selectedRunId}
        onChange={(event) => {
          props.onSelectRunId(event.target.value);
        }}
      >
        <option value="">Select a recent sealed record</option>
        {records.map((record) => (
          <option key={record.runId} value={record.runId}>
            {buyerFacingReviewTitleFromSummary(record)} ({record.runId})
          </option>
        ))}
      </select>
      {loadError ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} role="status">
          Recent sealed records could not be loaded.
        </p>
      ) : null}
    </div>
  );
}
