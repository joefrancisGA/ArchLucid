"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseTable } from "@/components/ui/enterprise-table";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  governanceFindingInspectHref,
} from "@/components/governance/findings/governance-findings-navigation";
import { groupGovernanceFindingQueueRows } from "@/lib/group-governance-finding-queue-rows";
import { useEnterpriseTableKeyboardNav } from "@/hooks/use-enterprise-table-keyboard-nav";
import {
  GOVERNANCE_FINDINGS_QUEUE_KEYBOARD_HINT_AT,
  governanceFindingsQueueTableAriaLabel,
} from "@/lib/governance/governance-assigned-to-me-queue-copy";
import {
  sortGovernanceAssignedToMeQueueRows,
  type GovernanceAssignedToMeQueueSortKey,
} from "@/lib/governance/governance-assigned-to-me-queue-sort";
import {
  governanceAssignedToMeSortHrefFromSearch,
  parseGovernanceAssignedToMeSortAscFromSearch,
  parseGovernanceAssignedToMeSortKeyFromSearch,
} from "@/lib/governance/governance-assigned-to-me-queue-sort-url";
import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";

import type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";
import {
  governanceFindingsQueueRowEstimatePx,
  shouldVirtualizeGovernanceFindingsQueue,
} from "./governance-findings-queue-virtualization";
import { GovernanceFindingsQueueTableBody } from "./GovernanceFindingsQueueTableBody";
import type { GovernanceFindingsQueueTableBodyProps } from "./GovernanceFindingsQueueTableBody";
import { GovernanceFindingsQueueTableHead } from "./GovernanceFindingsQueueTableHead";
import { GovernanceFindingsQueueVirtualizedTableBody } from "./GovernanceFindingsQueueVirtualizedTableBody";

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
  /** When set, Enter/row activation opens the triage panel instead of navigating away from the queue. */
  readonly onActivateRow?: (row: GovernanceFindingQueueRow, index: number) => void;
};

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
    onActivateRow,
  } = props;
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH;
  const searchParams = useSearchParams();
  const urlSortKey = parseGovernanceAssignedToMeSortKeyFromSearch(searchParams.get("sort"));
  const urlSortAsc = parseGovernanceAssignedToMeSortAscFromSearch(searchParams.get("dir"));
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const [assignedToMeSortKey, setAssignedToMeSortKey] =
    useState<GovernanceAssignedToMeQueueSortKey>(urlSortKey);
  const [assignedToMeSortAsc, setAssignedToMeSortAsc] = useState(urlSortAsc);

  useEffect(() => {
    setAssignedToMeSortKey(urlSortKey);
  }, [urlSortKey]);

  useEffect(() => {
    setAssignedToMeSortAsc(urlSortAsc);
  }, [urlSortAsc]);

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

      if (onActivateRow !== undefined) {
        onActivateRow(row, index);
        onRowOpened?.(row);
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
    const nextAsc =
      assignedToMeSortKey === nextSortKey
        ? !assignedToMeSortAsc
        : nextSortKey === "title" || nextSortKey === "sourceReview";

    if (assignedToMeSortKey === nextSortKey) {
      setAssignedToMeSortAsc(nextAsc);
    } else {
      setAssignedToMeSortKey(nextSortKey);
      setAssignedToMeSortAsc(nextAsc);
    }

    router.replace(
      governanceAssignedToMeSortHrefFromSearch(searchParams.toString(), nextSortKey, nextAsc, pathname),
      { scroll: false },
    );
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
