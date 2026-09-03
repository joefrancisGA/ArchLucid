"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";

import {
  buildCompareFindingLifecycleCountRows,
  compareFindingLifecycleStateLabel,
  COMPARE_FINDING_LIFECYCLE_ANCHOR,
  COMPARE_FINDING_LIFECYCLE_HEADING,
  type CompareFindingLifecycleRecord,
  type CompareFindingLifecycleState,
  type CompareFindingLifecycleSummary,
} from "@/lib/compare-finding-lifecycle";
import {
  compareFindingLifecycleStatusHrefFromSearch,
  COMPARE_FINDING_LIFECYCLE_STATUS_OPTIONS,
  parseCompareFindingLifecycleStatusFromSearch,
} from "@/lib/compare/compare-finding-lifecycle-status-url";
import { CompareFindingLifecycleRecordsTable } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareFindingLifecycleRecordsTable";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type CompareFindingLifecycleBlockProps = {
  readonly summary: CompareFindingLifecycleSummary | null;
  readonly records?: readonly CompareFindingLifecycleRecord[];
  readonly priorRunId?: string | null;
  readonly laterRunId?: string | null;
};

function lifecycleStatusChipLabel(state: CompareFindingLifecycleState): string {
  return compareFindingLifecycleStateLabel(state);
}

/** Self-suppressing: renders nothing when the comparison did not produce lifecycle counts. */
export function CompareFindingLifecycleBlock(props: CompareFindingLifecycleBlockProps): ReactElement | null {
  const { summary, records = [], priorRunId = null, laterRunId = null } = props;
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const activeStatus = parseCompareFindingLifecycleStatusFromSearch(
    searchParams.get("comparisonStatus"),
  );

  if (summary === null) {
    return null;
  }

  const countRows = buildCompareFindingLifecycleCountRows(summary);
  const prior = priorRunId?.trim() ?? "";
  const later = laterRunId?.trim() ?? "";
  const filteredRecords =
    activeStatus === null ? records : records.filter((record) => record.state === activeStatus);
  const showRecords = filteredRecords.length > 0 && prior.length > 0 && later.length > 0;

  return (
    <div
      id={COMPARE_FINDING_LIFECYCLE_ANCHOR}
      className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800"
      data-testid="compare-finding-lifecycle"
    >
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {COMPARE_FINDING_LIFECYCLE_HEADING}
      </h3>

      <FilterChipGroup
        aria-label="Filter finding lifecycle records"
        className="mt-3 flex flex-wrap gap-2"
        data-testid="compare-finding-lifecycle-status-chips"
      >
        <FilterChip
          href={compareFindingLifecycleStatusHrefFromSearch(currentSearch, null, pathname)}
          scroll={false}
          className={buyerFilterChipClass(activeStatus === null, false)}
          aria-current={activeStatus === null ? "page" : undefined}
        >
          All lifecycle states
        </FilterChip>
        {COMPARE_FINDING_LIFECYCLE_STATUS_OPTIONS.map((state) => (
          <FilterChip
            key={state}
            href={compareFindingLifecycleStatusHrefFromSearch(currentSearch, state, pathname)}
            scroll={false}
            className={buyerFilterChipClass(activeStatus === state, false)}
            aria-current={activeStatus === state ? "page" : undefined}
          >
            {lifecycleStatusChipLabel(state)}
          </FilterChip>
        ))}
      </FilterChipGroup>

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
        <CompareFindingLifecycleRecordsTable records={filteredRecords} priorRunId={prior} laterRunId={later} />
      ) : null}

      {activeStatus !== null && records.length > 0 && filteredRecords.length === 0 ? (
        <p className={cn("m-0 mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          No findings match {lifecycleStatusChipLabel(activeStatus).toLowerCase()}.{" "}
          <Link href={compareFindingLifecycleStatusHrefFromSearch(currentSearch, null, pathname)} className="underline">
            Clear lifecycle filter
          </Link>
        </p>
      ) : null}
    </div>
  );
}
