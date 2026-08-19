"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { CSSProperties, ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

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
import {
  GOVERNANCE_FINDINGS_QUEUE_KEYBOARD_HINT_AT,
  governanceFindingsQueueRecordColumnLabel,
  governanceFindingsQueueTableAriaLabel,
} from "@/lib/governance/governance-assigned-to-me-queue-copy";
import {
  sortGovernanceAssignedToMeQueueRows,
  type GovernanceAssignedToMeQueueSortKey,
} from "@/lib/governance/governance-assigned-to-me-queue-sort";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";

import type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";
import { GovernanceFindingsQueueTableRow } from "./GovernanceFindingsQueueTableRow";
import {
  governanceFindingsQueueRowEstimatePx,
  shouldVirtualizeGovernanceFindingsQueue,
} from "./governance-findings-queue-virtualization";

export type GovernanceFindingsQueueDesktopTableProps = {
  readonly rows: readonly GovernanceFindingQueueRow[];
  readonly buyerPolishedShell: boolean;
  readonly groupByResource?: boolean;
  readonly queueMode?: GovernanceFindingsQueueMode;
  /** When provided, the table renders a leading checkbox column for bulk selection. */
  readonly selectedFindingIds?: ReadonlySet<string>;
  readonly onSelectionChange?: (ids: ReadonlySet<string>) => void;
  readonly isRowNewSinceLastVisit?: (row: GovernanceFindingQueueRow) => boolean;
  readonly onRowOpened?: (row: GovernanceFindingQueueRow) => void;
};

type GovernanceFindingsQueueTableBodyProps = {
  readonly rows: readonly GovernanceFindingQueueRow[];
  readonly buyerPolishedShell: boolean;
  readonly queueMode: GovernanceFindingsQueueMode;
  readonly hasBulkSelect: boolean;
  readonly selectedFindingIds?: ReadonlySet<string>;
  readonly onToggleRow?: (findingId: string) => void;
  readonly isRowFocused?: (index: number) => boolean;
  readonly isRowNewSinceLastVisit?: (row: GovernanceFindingQueueRow) => boolean;
  readonly onRowOpened?: (row: GovernanceFindingQueueRow) => void;
  readonly ariaRowCount?: number;
};

function GovernanceFindingsQueueSortHeaderCell(props: {
  readonly label: string;
  readonly sortKey: GovernanceAssignedToMeQueueSortKey;
  readonly activeSortKey: GovernanceAssignedToMeQueueSortKey;
  readonly sortAsc: boolean;
  readonly onSort: (sortKey: GovernanceAssignedToMeQueueSortKey) => void;
}): ReactElement {
  const isActive = props.activeSortKey === props.sortKey;
  const directionLabel = props.sortAsc ? "ascending" : "descending";

  return (
    <EnterpriseTableHeaderCell>
      <button
        type="button"
        className={cn(
          "font-inherit text-left font-semibold text-al-text-secondary hover:text-al-text-primary",
          isActive ? "text-al-text-primary" : undefined,
        )}
        aria-label={
          isActive ? `Sort by ${props.label}, ${directionLabel}` : `Sort by ${props.label}`
        }
        onClick={() => {
          props.onSort(props.sortKey);
        }}
      >
        {props.label}
        {isActive ? (props.sortAsc ? " ↑" : " ↓") : null}
      </button>
    </EnterpriseTableHeaderCell>
  );
}

function GovernanceFindingsQueueTableHead(props: {
  readonly buyerPolishedShell: boolean;
  readonly queueMode: GovernanceFindingsQueueMode;
  readonly hasBulkSelect: boolean;
  readonly allSelected: boolean;
  readonly someSelected: boolean;
  readonly onToggleAll: () => void;
  readonly sticky?: boolean;
  readonly assignedToMeSortKey?: GovernanceAssignedToMeQueueSortKey;
  readonly assignedToMeSortAsc?: boolean;
  readonly onAssignedToMeSort?: (sortKey: GovernanceAssignedToMeQueueSortKey) => void;
}): ReactElement {
  const {
    buyerPolishedShell,
    queueMode,
    hasBulkSelect,
    allSelected,
    someSelected,
    onToggleAll,
    sticky,
    assignedToMeSortKey = "severity",
    assignedToMeSortAsc = true,
    onAssignedToMeSort,
  } = props;
  const isAssignedToMe = queueMode === "assigned-to-me";

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
        ) : isAssignedToMe ? (
          <>
            <GovernanceFindingsQueueSortHeaderCell
              label={governanceFindingsQueueRecordColumnLabel(queueMode)}
              sortKey="title"
              activeSortKey={assignedToMeSortKey}
              sortAsc={assignedToMeSortAsc}
              onSort={(sortKey) => {
                onAssignedToMeSort?.(sortKey);
              }}
            />
            <GovernanceFindingsQueueSortHeaderCell
              label="Source review"
              sortKey="sourceReview"
              activeSortKey={assignedToMeSortKey}
              sortAsc={assignedToMeSortAsc}
              onSort={(sortKey) => {
                onAssignedToMeSort?.(sortKey);
              }}
            />
            <GovernanceFindingsQueueSortHeaderCell
              label="Severity"
              sortKey="severity"
              activeSortKey={assignedToMeSortKey}
              sortAsc={assignedToMeSortAsc}
              onSort={(sortKey) => {
                onAssignedToMeSort?.(sortKey);
              }}
            />
            <GovernanceFindingsQueueSortHeaderCell
              label="Due / revisit"
              sortKey="due"
              activeSortKey={assignedToMeSortKey}
              sortAsc={assignedToMeSortAsc}
              onSort={(sortKey) => {
                onAssignedToMeSort?.(sortKey);
              }}
            />
            <EnterpriseTableHeaderCell>Disposition</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          </>
        ) : (
          <>
            <EnterpriseTableHeaderCell>Risk</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Source review</EnterpriseTableHeaderCell>
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
    queueMode,
    hasBulkSelect,
    selectedFindingIds,
    onToggleRow,
    isRowFocused,
    isRowNewSinceLastVisit,
    onRowOpened,
    ariaRowCount,
  } = props;

  return (
    <EnterpriseTableBody aria-rowcount={ariaRowCount}>
      {rows.map((row, rowIndex) => (
        <GovernanceFindingsQueueTableRow
          key={`${row.runId}:${row.findingId}:table`}
          row={row}
          buyerPolishedShell={buyerPolishedShell}
          queueMode={queueMode}
          hasBulkSelect={hasBulkSelect}
          selectedFindingIds={selectedFindingIds}
          onToggleRow={onToggleRow}
          isFocused={isRowFocused?.(rowIndex)}
          showNewSinceLastVisit={isRowNewSinceLastVisit?.(row) ?? false}
          onOpenRow={() => {
            onRowOpened?.(row);
          }}
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
    queueMode,
    hasBulkSelect,
    selectedFindingIds,
    onToggleRow,
    isRowFocused,
    rowVirtualizer,
    isRowNewSinceLastVisit,
    onRowOpened,
    ariaRowCount,
  } = props;

  return (
    <EnterpriseTableBody
      aria-rowcount={ariaRowCount}
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
            queueMode={queueMode}
            hasBulkSelect={hasBulkSelect}
            selectedFindingIds={selectedFindingIds}
            onToggleRow={onToggleRow}
            isFocused={isRowFocused?.(virtualRow.index)}
            style={rowStyle}
            showNewSinceLastVisit={isRowNewSinceLastVisit?.(row) ?? false}
            onOpenRow={() => {
              onRowOpened?.(row);
            }}
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
    queueMode = "tenant",
    selectedFindingIds,
    onSelectionChange,
    isRowNewSinceLastVisit,
    onRowOpened,
  } = props;
  const router = useRouter();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const [assignedToMeSortKey, setAssignedToMeSortKey] =
    useState<GovernanceAssignedToMeQueueSortKey>("severity");
  const [assignedToMeSortAsc, setAssignedToMeSortAsc] = useState(true);
  const displayRows = useMemo(() => {
    if (queueMode !== "assigned-to-me") {
      return rows;
    }

    return sortGovernanceAssignedToMeQueueRows(rows, assignedToMeSortKey, assignedToMeSortAsc);
  }, [assignedToMeSortAsc, assignedToMeSortKey, queueMode, rows]);
  const hasBulkSelect = selectedFindingIds !== undefined && onSelectionChange !== undefined;
  const allSelected =
    hasBulkSelect && displayRows.length > 0 && displayRows.every((r) => selectedFindingIds.has(r.findingId));
  const someSelected = hasBulkSelect && displayRows.some((r) => selectedFindingIds.has(r.findingId));
  const useVirtualization = !groupByResource && shouldVirtualizeGovernanceFindingsQueue(displayRows.length);

  const keyboardNav = useEnterpriseTableKeyboardNav({
    rowCount: groupByResource ? 0 : displayRows.length,
    onActivateRow: (index) => {
      const row = displayRows[index];

      if (row === undefined) {
        return;
      }

      router.push(governanceFindingInspectHref(row.runId, row.findingId));
      onRowOpened?.(row);
    },
  });

  const rowVirtualizer = useVirtualizer({
    count: useVirtualization ? displayRows.length : 0,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => governanceFindingsQueueRowEstimatePx(queueMode),
    overscan: 8,
  });

  useEffect(() => {
    if (!useVirtualization) {
      return;
    }

    rowVirtualizer.scrollToIndex(keyboardNav.focusedRowIndex, { align: "auto" });
  }, [keyboardNav.focusedRowIndex, rowVirtualizer, useVirtualization]);

  function toggleAssignedToMeSort(nextSortKey: GovernanceAssignedToMeQueueSortKey): void {
    if (assignedToMeSortKey === nextSortKey) {
      setAssignedToMeSortAsc((current) => !current);
      return;
    }

    setAssignedToMeSortKey(nextSortKey);
    setAssignedToMeSortAsc(nextSortKey === "title" || nextSortKey === "sourceReview");
  }

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

  function toggleAll(scopeRows: readonly GovernanceFindingQueueRow[] = displayRows) {
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

  const ariaLabel = governanceFindingsQueueTableAriaLabel(queueMode);
  const resourceGroups = groupByResource ? groupGovernanceFindingQueueRows(displayRows) : [];
  const ariaRowCount = displayRows.length + 1;

  const tableHead = (
    <GovernanceFindingsQueueTableHead
      buyerPolishedShell={buyerPolishedShell}
      queueMode={queueMode}
      hasBulkSelect={hasBulkSelect}
      allSelected={allSelected}
      someSelected={someSelected}
      onToggleAll={() => {
        toggleAll();
      }}
      sticky={useVirtualization}
      assignedToMeSortKey={assignedToMeSortKey}
      assignedToMeSortAsc={assignedToMeSortAsc}
      onAssignedToMeSort={toggleAssignedToMeSort}
    />
  );

  const tableBodyProps: GovernanceFindingsQueueTableBodyProps = {
    rows: displayRows,
    buyerPolishedShell,
    queueMode,
    hasBulkSelect,
    selectedFindingIds,
    onToggleRow: toggleRow,
    isRowFocused: keyboardNav.isRowFocused,
    isRowNewSinceLastVisit,
    onRowOpened,
    ariaRowCount: useVirtualization ? ariaRowCount : undefined,
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
      <p className="sr-only">{GOVERNANCE_FINDINGS_QUEUE_KEYBOARD_HINT_AT}</p>
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
                    queueMode={queueMode}
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
                    queueMode={queueMode}
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
