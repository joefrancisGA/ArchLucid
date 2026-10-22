"use client";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { truncateMiddle } from "@/lib/truncate-middle";
import { cn } from "@/lib/utils";

import {
  formatOperationalErrorUtc,
  truncateOperationalErrorMessage,
  type OperationalErrorRow,
} from "./operational-errors-presentation";

export type OperationalErrorsTableProps = {
  rows: readonly OperationalErrorRow[];
  selectedId: string | null;
  onSelect: (row: OperationalErrorRow) => void;
};

export function OperationalErrorsTable({ rows, selectedId, onSelect }: OperationalErrorsTableProps) {
  return (
    <EnterpriseTable ariaLabel="Operational errors">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Occurred (UTC)</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Category</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Path</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Message</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Correlation</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Tenant</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {rows.map((row) => (
          <EnterpriseTableRow
            key={row.id}
            data-state={selectedId === row.id ? "selected" : undefined}
            className={cn(selectedId === row.id && "bg-al-surface-muted/60")}
          >
            <EnterpriseTableCell>
              <button
                type="button"
                className={cn("text-left hover:underline", OPERATOR_TYPOGRAPHY.helper)}
                onClick={() => onSelect(row)}
              >
                {formatOperationalErrorUtc(row.occurredUtc)}
              </button>
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <StatusTag kind="neutral" label={row.category} />
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <span className={OPERATOR_TYPOGRAPHY.helper}>{row.httpStatusCode ?? "—"}</span>
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                {row.requestPath ?? "—"}
              </span>
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <button
                type="button"
                className={cn("text-left hover:underline", OPERATOR_TYPOGRAPHY.helper)}
                onClick={() => onSelect(row)}
              >
                {truncateOperationalErrorMessage(row.message)}
              </button>
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                {row.correlationId ? truncateMiddle(row.correlationId, 18) : "—"}
              </span>
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>
                {row.tenantId ? truncateMiddle(row.tenantId, 18) : "—"}
              </span>
            </EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
