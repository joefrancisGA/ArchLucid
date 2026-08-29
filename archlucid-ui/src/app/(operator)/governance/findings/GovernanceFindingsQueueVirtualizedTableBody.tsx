import { useVirtualizer } from "@tanstack/react-virtual";
import type { CSSProperties, ReactElement } from "react";

import { EnterpriseTableBody } from "@/components/ui/enterprise-table";

import { GovernanceFindingsQueueTableRow } from "./GovernanceFindingsQueueTableRow";
import type { GovernanceFindingsQueueTableBodyProps } from "./GovernanceFindingsQueueTableBody";

export type GovernanceFindingsQueueVirtualizedTableBodyProps = GovernanceFindingsQueueTableBodyProps & {
  readonly rowVirtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
};

export function GovernanceFindingsQueueVirtualizedTableBody(
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
