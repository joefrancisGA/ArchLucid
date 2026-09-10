"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactElement } from "react";
import { useEffect, useRef } from "react";

import { RunDetailFindingsDenseTableRow } from "@/components/findings/RunDetailFindingsDenseTableRow";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { useEnterpriseTableKeyboardNav } from "@/hooks/use-enterprise-table-keyboard-nav";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getFindingDetailHref } from "@/lib/findings/finding-evidence-navigation";
import {
  OPERATOR_LIST_VIRTUALIZE_MIN_ROWS,
  shouldVirtualizeOperatorList,
} from "@/lib/operator/operator-list-virtualization";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

const RUN_DETAIL_FINDINGS_ROW_ESTIMATE_PX = 72;

export type RunDetailFindingsDenseTableProps = {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
  readonly showDensityScore?: boolean;
};

export function RunDetailFindingsDenseTable(props: RunDetailFindingsDenseTableProps): ReactElement {
  const { runId, findings, showDensityScore = false } = props;
  const router = useRouter();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const useVirtualization = shouldVirtualizeOperatorList(findings.length);

  const keyboardNav = useEnterpriseTableKeyboardNav({
    rowCount: findings.length,
    onActivateRow: (index) => {
      const finding = findings[index];

      if (finding === undefined) {
        return;
      }

      router.push(getFindingDetailHref(runId, finding.findingId));
    },
  });

  const rowVirtualizer = useVirtualizer({
    count: useVirtualization ? findings.length : 0,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => RUN_DETAIL_FINDINGS_ROW_ESTIMATE_PX,
    overscan: 8,
  });

  useEffect(() => {
    if (!useVirtualization) {
      return;
    }

    rowVirtualizer.scrollToIndex(keyboardNav.focusedRowIndex, { align: "auto" });
  }, [keyboardNav.focusedRowIndex, rowVirtualizer, useVirtualization]);

  const tableHead = (
    <EnterpriseTableHead>
      <EnterpriseTableRow>
        <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Finding</EnterpriseTableHeaderCell>
        {showDensityScore ? <EnterpriseTableHeaderCell>Density</EnterpriseTableHeaderCell> : null}
        <EnterpriseTableHeaderCell>Confidence</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
        <EnterpriseTableHeaderCell>Evidence</EnterpriseTableHeaderCell>
      </EnterpriseTableRow>
    </EnterpriseTableHead>
  );

  const ariaRowCount = findings.length + 1;

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label="Review findings"
      onKeyDown={keyboardNav.onTableKeyDown}
      data-testid="run-detail-findings-dense-table-region"
    >
      <p className={cn("mb-2 text-neutral-500", DESIGN_TOKENS.table.cellSecondary)} aria-hidden="true">
        <kbd className={cn("rounded border border-neutral-300 px-1 font-mono dark:border-neutral-600", OPERATOR_TYPOGRAPHY.micro)}>
          j
        </kbd>
        /
        <kbd className={cn("rounded border border-neutral-300 px-1 font-mono dark:border-neutral-600", OPERATOR_TYPOGRAPHY.micro)}>
          k
        </kbd>
        {" move rows · "}
        <kbd className={cn("rounded border border-neutral-300 px-1 font-mono dark:border-neutral-600", OPERATOR_TYPOGRAPHY.micro)}>
          Enter
        </kbd>
        {" open finding"}
      </p>
      {useVirtualization ? (
        <div
          ref={scrollParentRef}
          className="max-h-[min(32rem,70vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800"
          data-testid="run-detail-findings-virtual-scroll"
        >
          <EnterpriseTable ariaLabel="Review findings" className="border-0">
            {tableHead}
            <EnterpriseTableBody
              aria-rowcount={ariaRowCount}
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const finding = findings[virtualRow.index];

                if (finding === undefined) {
                  return null;
                }

                const rowStyle: CSSProperties = {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                  display: "table",
                  tableLayout: "fixed",
                };

                return (
                  <RunDetailFindingsDenseTableRow
                    key={finding.findingId}
                    runId={runId}
                    finding={finding}
                    showDensityScore={showDensityScore}
                    isFocused={keyboardNav.isRowFocused(virtualRow.index)}
                    style={rowStyle}
                  />
                );
              })}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </div>
      ) : (
        <EnterpriseTable ariaLabel="Review findings" data-testid="run-detail-findings-dense-table">
          {tableHead}
          <EnterpriseTableBody aria-rowcount={ariaRowCount}>
            {findings.map((finding, index) => (
              <RunDetailFindingsDenseTableRow
                key={finding.findingId}
                runId={runId}
                finding={finding}
                showDensityScore={showDensityScore}
                isFocused={keyboardNav.isRowFocused(index)}
              />
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      )}
      {findings.length >= OPERATOR_LIST_VIRTUALIZE_MIN_ROWS ? (
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="run-detail-findings-virtualized-hint">
          Large list — rows virtualize after {OPERATOR_LIST_VIRTUALIZE_MIN_ROWS} findings.
        </p>
      ) : null}
    </div>
  );
}
