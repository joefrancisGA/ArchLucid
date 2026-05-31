import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type EnterpriseTableProps = TableHTMLAttributes<HTMLTableElement> & {
  /** Accessible name when the table caption is not visible. */
  ariaLabel: string;
};

export function EnterpriseTable({
  ariaLabel,
  className,
  children,
  ...rest
}: EnterpriseTableProps): React.ReactElement {
  return (
    <div className={DESIGN_TOKENS.table.shell}>
      <table
        className={cn(DESIGN_TOKENS.table.table, className)}
        aria-label={ariaLabel}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
}

export function EnterpriseTableHead({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>): React.ReactElement {
  return (
    <thead className={cn(className)} {...rest}>
      {children}
    </thead>
  );
}

export function EnterpriseTableBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>): React.ReactElement {
  return (
    <tbody className={cn(DESIGN_TOKENS.table.body, className)} {...rest}>
      {children}
    </tbody>
  );
}

export function EnterpriseTableRow({
  className,
  selected,
  children,
  ...rest
}: HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }): React.ReactElement {
  return (
    <tr
      className={cn(
        DESIGN_TOKENS.table.row,
        selected ? DESIGN_TOKENS.table.rowSelected : null,
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function EnterpriseTableHeaderCell({
  className,
  children,
  sortDirection,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & {
  sortDirection?: "ascending" | "descending" | "none";
}): React.ReactElement {
  return (
    <th
      className={cn(DESIGN_TOKENS.table.headCell, className)}
      scope="col"
      aria-sort={sortDirection}
      {...rest}
    >
      {children}
    </th>
  );
}

export function EnterpriseTableCell({
  className,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>): React.ReactElement {
  return (
    <td className={cn(DESIGN_TOKENS.table.cell, className)} {...rest}>
      {children}
    </td>
  );
}

export function EnterpriseTableHeadRow({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>): React.ReactElement {
  return (
    <tr className={cn(DESIGN_TOKENS.table.headRow, className)} {...rest}>
      {children}
    </tr>
  );
}
