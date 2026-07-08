"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactElement } from "react";
import { useEffect, useRef } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
} from "@/components/ui/enterprise-table";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  governanceFindingInspectHref,
} from "@/components/governance/findings/governance-findings-navigation";
import { groupGovernanceFindingQueueRows } from "@/lib/group-governance-finding-queue-rows";
import { useEnterpriseTableKeyboardNav } from "@/hooks/use-enterprise-table-keyboard-nav";

import type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";
import { GovernanceFindingsQueueTableRow } from "./GovernanceFindingsQueueTableRow";
import {
  GOVERNANCE_FINDINGS_QUEUE_ROW_ESTIMATE_PX,
  shouldVirtualizeGovernanceFindingsQueue,
} from "./governance-findings-queue-virtualization";

export type GovernanceFindingsQueueDesktopTableProps = {
  readonly rows: readonly GovernanceFindingQueueRow[];
  readonly buyerPolishedShell: boolean;
  readonly groupByResource?: boolean;
  /** When provided, the table renders a leading checkbox column for bulk selection. */
  readonly selectedFindingIds?: ReadonlySet<string>;
  readonly onSelectionChange?: (ids: ReadonlySet<string>) => void;
};

type GovernanceFindingsQueueTableBodyProps = {
  readonly rows: readonly GovernanceFindingQueueRow[];
  readonly buyerPolishedShell: boolean;
  readonly hasBulkSelect: boolean;
  readonly selectedFindingIds?: ReadonlySet<string>;
  readonly onToggleRow?: (findingId: string) => void;
  readonly isRowFocused?: (index: number) => boolean;
};

function GovernanceFindingsQueueTableHead(props: {
  readonly buyerPolishedShell: boolean;
  readonly hasBulkSelect: boolean;
  readonly allSelected: boolean;
  readonly someSelected: boolean;
  readonly onToggleAll: () => void;
  readonly sticky?: boolean;
}): ReactElement {
  const { buyerPolishedShell, hasBulkSelect, allSelected, someSelected, onToggleAll, sticky } = props;

  return (
    <EnterpriseTableHead
      className={
        sticky
          ? "sticky top-0 z-[1] bg-al-surface-raised shadow-[0_1px_0_0_rgb(229_229_229)] dark:shadow-[0_1px_0_0_rgb(38_38_38)]"
          : undefined
      }
    >
      <EnterpriseTableHeadRow>
        {hasBulkSelect ? (
          <EnterpriseTableHeaderCell className="w-8">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-teal-700 dark:border-neutral-600"
              aria-label={allSelected ? "Deselect all findings" : "Select all findings on this page"}
              checked={allSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate = someSelected && !allSelected;
                }
              }}
              onChange={onToggleAll}
            />
          </EnterpriseTableHeaderCell>
        ) : null}
        {buyerPolishedShell ? (
          <>
            <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Confidence</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Record</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Record summary</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Recommended action</EnterpriseTableHeaderCell>
          </>
        ) : (
          <>
            <EnterpriseTableHeaderCell>Risk</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Source review package</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Owner</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Disposition</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Age</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Exception expiry</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Last decision</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          </>
        )}
        <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
      </EnterpriseTableHeadRow>
    </EnterpriseTableHead>
  );
}

function GovernanceFindingsQueueTableBody(props: GovernanceFindingsQueueTableBodyProps): ReactElement {
  const {
    rows,
    buyerPolishedShell,
    hasBulkSelect,
    selectedFindingIds,
    onToggleRow,
    isRowFocused,
  } = props;

  return (
    <EnterpriseTableBody>
      {rows.map((row, rowIndex) => (
        <GovernanceFindingsQueueTableRow
          key={`${row.runId}:${row.findingId}:table`}
          row={row}
          buyerPolishedShell={buyerPolishedShell}
          hasBulkSelect={hasBulkSelect}
          selectedFindingIds={selectedFindingIds}
          onToggleRow={onToggleRow}
          isFocused={isRowFocused?.(rowIndex)}
        />
      ))}
    </EnterpriseTableBody>
  );
}

type GovernanceFindingsQueueVirtualizedTableBodyProps = GovernanceFindingsQueueTableBodyProps & {
  readonly rowVirtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
};

function GovernanceFindingsQueueVirtualizedTableBody(
  props: GovernanceFindingsQueueVirtualizedTableBodyProps,
): ReactElement {
  const {
    rows,
    buyerPolishedShell,
    hasBulkSelect,
    selectedFindingIds,
    onToggleRow,
    isRowFocused,
    rowVirtualizer,
  } = props;

  return (
    <EnterpriseTableBody
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        position: "relative",
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index];

        if (row === undefined) {
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
          <GovernanceFindingsQueueTableRow
            key={`${row.runId}:${row.findingId}:virtual`}
            row={row}
            buyerPolishedShell={buyerPolishedShell}
            hasBulkSelect={hasBulkSelect}
            selectedFindingIds={selectedFindingIds}
            onToggleRow={onToggleRow}
            isFocused={isRowFocused?.(virtualRow.index)}
            style={rowStyle}
          />
        );
      })}
    </EnterpriseTableBody>
  );
}

/** Carbon-style desktop queue for architecture risks and recorded decisions (md+). */
export function GovernanceFindingsQueueDesktopTable(
  props: GovernanceFindingsQueueDesktopTableProps,
): ReactElement {
  const {
    rows,
    buyerPolishedShell,
    groupByResource = false,
    selectedFindingIds,
    onSelectionChange,
  } = props;
  const router = useRouter();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const hasBulkSelect = selectedFindingIds !== undefined && onSelectionChange !== undefined;
  const allSelected = hasBulkSelect && rows.length > 0 && rows.every((r) => selectedFindingIds.has(r.findingId));
  const someSelected = hasBulkSelect && rows.some((r) => selectedFindingIds.has(r.findingId));
  const useVirtualization = !groupByResource && shouldVirtualizeGovernanceFindingsQueue(rows.length);

  const keyboardNav = useEnterpriseTableKeyboardNav({
    rowCount: groupByResource ? 0 : rows.length,
    onActivateRow: (index) => {
      const row = rows[index];

      if (row === undefined) {
        return;
      }

      router.push(governanceFindingInspectHref(row.runId, row.findingId));
    },
  });

  const rowVirtualizer = useVirtualizer({
    count: useVirtualization ? rows.length : 0,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => GOVERNANCE_FINDINGS_QUEUE_ROW_ESTIMATE_PX,
    overscan: 8,
  });

  useEffect(() => {
    if (!useVirtualization) {
      return;
    }

    rowVirtualizer.scrollToIndex(keyboardNav.focusedRowIndex, { align: "auto" });
  }, [keyboardNav.focusedRowIndex, rowVirtualizer, useVirtualization]);

  function toggleRow(findingId: string) {
    if (!hasBulkSelect) {
      return;
    }

    const next = new Set(selectedFindingIds);

    if (next.has(findingId)) {
      next.delete(findingId);
    } else {
      next.add(findingId);
    }

    onSelectionChange(next);
  }

  function toggleAll(scopeRows: readonly GovernanceFindingQueueRow[] = rows) {
    if (!hasBulkSelect) {
      return;
    }

    const scopeIds = new Set(scopeRows.map((row) => row.findingId));
    const allScopeSelected =
      scopeRows.length > 0 && scopeRows.every((row) => selectedFindingIds.has(row.findingId));

    if (allScopeSelected) {
      const next = new Set(selectedFindingIds);

      for (const id of scopeIds) {
        next.delete(id);
      }

      onSelectionChange(next);
      return;
    }

    const next = new Set(selectedFindingIds);

    for (const id of scopeIds) {
      next.add(id);
    }

    onSelectionChange(next);
  }

  const ariaLabel = buyerPolishedShell ? "Risk register" : "Architecture risk register";
  const resourceGroups = groupByResource ? groupGovernanceFindingQueueRows(rows) : [];

  const tableHead = (
    <GovernanceFindingsQueueTableHead
      buyerPolishedShell={buyerPolishedShell}
      hasBulkSelect={hasBulkSelect}
      allSelected={allSelected}
      someSelected={someSelected}
      onToggleAll={() => {
        toggleAll();
      }}
      sticky={useVirtualization}
    />
  );

  const tableBodyProps: GovernanceFindingsQueueTableBodyProps = {
    rows,
    buyerPolishedShell,
    hasBulkSelect,
    selectedFindingIds,
    onToggleRow: toggleRow,
    isRowFocused: keyboardNav.isRowFocused,
  };

  return (
    <div
      className="hidden md:block"
      tabIndex={groupByResource ? undefined : 0}
      role="region"
      aria-label={ariaLabel}
      onKeyDown={groupByResource ? undefined : keyboardNav.onTableKeyDown}
      data-testid="governance-findings-queue-keyboard-region"
    >
      {groupByResource ? (
        <p className={cn("mb-2 text-neutral-500", DESIGN_TOKENS.table.cellSecondary)} aria-hidden="true">
          Findings are grouped by resource or system context. Turn off Group by resource to restore row keyboard navigation.
        </p>
      ) : (
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
      )}

      {groupByResource ? (
        <div className="space-y-3" data-testid="governance-findings-resource-groups">
          {resourceGroups.map((group) => {
            const groupAllSelected =
              hasBulkSelect &&
              group.rows.length > 0 &&
              group.rows.every((row) => selectedFindingIds.has(row.findingId));
            const groupSomeSelected = hasBulkSelect && group.rows.some((row) => selectedFindingIds.has(row.findingId));
            const recordLabel = group.rows.length === 1 ? "record" : "records";

            return (
              <CollapsibleSection
                key={group.key}
                title={`${group.label} (${group.rows.length} ${recordLabel})`}
                defaultOpen
                sectionTestId={`governance-findings-resource-group-${group.key}`}
              >
                <EnterpriseTable ariaLabel={`${group.label} findings`}>
                  <GovernanceFindingsQueueTableHead
                    buyerPolishedShell={buyerPolishedShell}
                    hasBulkSelect={hasBulkSelect}
                    allSelected={groupAllSelected}
                    someSelected={groupSomeSelected}
                    onToggleAll={() => {
                      toggleAll(group.rows);
                    }}
                  />
                  <GovernanceFindingsQueueTableBody
                    rows={group.rows}
                    buyerPolishedShell={buyerPolishedShell}
                    hasBulkSelect={hasBulkSelect}
                    selectedFindingIds={selectedFindingIds}
                    onToggleRow={toggleRow}
                  />
                </EnterpriseTable>
              </CollapsibleSection>
            );
          })}
        </div>
      ) : useVirtualization ? (
        <div
          ref={scrollParentRef}
          className="max-h-[min(32rem,70vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-neutral-800"
          data-testid="governance-findings-queue-virtual-scroll"
        >
          <EnterpriseTable ariaLabel={ariaLabel} className="border-0">
            {tableHead}
            <GovernanceFindingsQueueVirtualizedTableBody
              {...tableBodyProps}
              rowVirtualizer={rowVirtualizer}
            />
          </EnterpriseTable>
        </div>
      ) : (
        <EnterpriseTable ariaLabel={ariaLabel}>
          {tableHead}
          <GovernanceFindingsQueueTableBody {...tableBodyProps} />
        </EnterpriseTable>
      )}
    </div>
  );
}
