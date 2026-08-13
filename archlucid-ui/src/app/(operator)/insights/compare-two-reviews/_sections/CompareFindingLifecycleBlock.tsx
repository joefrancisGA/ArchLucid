import type { ReactElement } from "react";

import {
  buildCompareFindingLifecycleCountRows,
  COMPARE_FINDING_LIFECYCLE_ANCHOR,
  COMPARE_FINDING_LIFECYCLE_HEADING,
  type CompareFindingLifecycleRecord,
  type CompareFindingLifecycleSummary,
} from "@/lib/compare-finding-lifecycle";
import { CompareFindingLifecycleRecordsTable } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareFindingLifecycleRecordsTable";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CompareFindingLifecycleBlockProps = {
  readonly summary: CompareFindingLifecycleSummary | null;
  readonly records?: readonly CompareFindingLifecycleRecord[];
  readonly priorRunId?: string | null;
  readonly laterRunId?: string | null;
};

/** Self-suppressing: renders nothing when the comparison did not produce lifecycle counts. */
export function CompareFindingLifecycleBlock(props: CompareFindingLifecycleBlockProps): ReactElement | null {
  const { summary, records = [], priorRunId = null, laterRunId = null } = props;

  if (summary === null) {
    return null;
  }

  const countRows = buildCompareFindingLifecycleCountRows(summary);
  const prior = priorRunId?.trim() ?? "";
  const later = laterRunId?.trim() ?? "";
  const showRecords = records.length > 0 && prior.length > 0 && later.length > 0;

  return (
    <div
      id={COMPARE_FINDING_LIFECYCLE_ANCHOR}
      className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      data-testid="compare-finding-lifecycle"
    >
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {COMPARE_FINDING_LIFECYCLE_HEADING}
      </h3>

      <ul className={cn("m-0 mt-3 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        {countRows.map((row) => (
          <li
            key={row.testId}
            className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
            data-testid={row.testId}
          >
            <span className="text-al-text-secondary">{row.label}</span>
            <span className="ml-2 font-semibold text-al-text-primary">{row.value}</span>
          </li>
        ))}
      </ul>

      <p
        className={cn(
          "m-0 mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-al-text-primary dark:border-neutral-800 dark:bg-neutral-900/40",
          OPERATOR_TYPOGRAPHY.helper,
        )}
        data-testid="compare-finding-lifecycle-honesty"
      >
        <strong className="text-al-text-primary">What these counts do and do not prove:</strong>{" "}
        {summary.honestyNote}
      </p>

      {showRecords ? (
        <CompareFindingLifecycleRecordsTable records={records} priorRunId={prior} laterRunId={later} />
      ) : null}
    </div>
  );
}
