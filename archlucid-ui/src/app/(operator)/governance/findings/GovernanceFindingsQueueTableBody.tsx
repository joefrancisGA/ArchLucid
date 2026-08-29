import type { ReactElement } from "react";

import { EnterpriseTableBody } from "@/components/ui/enterprise-table";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";

import type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";
import { GovernanceFindingsQueueTableRow } from "./GovernanceFindingsQueueTableRow";

export type GovernanceFindingsQueueTableBodyProps = {
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

export function GovernanceFindingsQueueTableBody(props: GovernanceFindingsQueueTableBodyProps): ReactElement {
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
