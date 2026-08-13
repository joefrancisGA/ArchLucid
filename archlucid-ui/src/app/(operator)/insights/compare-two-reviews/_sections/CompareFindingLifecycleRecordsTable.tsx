import Link from "next/link";
import type { ReactElement } from "react";

import {
  buildCompareFindingLifecycleStatusSentence,
  type CompareFindingLifecycleRecord,
} from "@/lib/compare-finding-lifecycle";
import { getFindingDetailHref } from "@/lib/findings/finding-evidence-navigation";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CompareFindingLifecycleRecordsTableProps = {
  readonly records: readonly CompareFindingLifecycleRecord[];
  readonly priorRunId: string;
  readonly laterRunId: string;
};

function buildFindingInspectHref(
  record: CompareFindingLifecycleRecord,
  priorRunId: string,
  laterRunId: string,
): string | null {
  if (record.currentFindingId !== null) {
    const href = getFindingDetailHref(laterRunId, record.currentFindingId);
    const params = new URLSearchParams({ priorRunId });

    return `${href}?${params.toString()}`;
  }

  if (record.priorFindingId !== null) {
    const href = getFindingDetailHref(priorRunId, record.priorFindingId);
    const params = new URLSearchParams({ laterRunId });

    return `${href}?${params.toString()}`;
  }

  return null;
}

function recordRowKey(record: CompareFindingLifecycleRecord, index: number): string {
  return [
    record.priorFindingId ?? "",
    record.currentFindingId ?? "",
    record.category,
    record.message,
    String(index),
  ].join(":");
}

/** Per-finding lifecycle rows for compare-two-reviews (TB-2194). */
export function CompareFindingLifecycleRecordsTable(
  props: CompareFindingLifecycleRecordsTableProps,
): ReactElement | null {
  const { records, priorRunId, laterRunId } = props;

  if (records.length === 0) {
    return null;
  }

  return (
    <div className="mt-4" data-testid="compare-finding-lifecycle-records">
      <h4 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Per finding</h4>

      <ul className={cn("m-0 mt-3 grid gap-2", OPERATOR_TYPOGRAPHY.body)}>
        {records.map((record, index) => {
          const inspectHref = buildFindingInspectHref(record, priorRunId, laterRunId);
          const label = record.message.length > 0 ? record.message : record.category;
          const statusSentence = buildCompareFindingLifecycleStatusSentence(record);

          return (
            <li
              key={recordRowKey(record, index)}
              className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
              data-testid="compare-finding-lifecycle-record-row"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-al-text-primary">{label}</span>
                {record.severity.length > 0 ? (
                  <span className="text-al-text-secondary">{record.severity}</span>
                ) : null}
              </div>

              <p className="m-0 mt-1 text-al-text-secondary" data-testid="compare-finding-lifecycle-record-status">
                {statusSentence}
              </p>

              {inspectHref !== null ? (
                <Link className={cn("mt-2 inline-block", OPERATOR_LINK.inline)} href={inspectHref}>
                  Open finding inspect
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
