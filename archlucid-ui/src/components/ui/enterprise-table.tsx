import { cn } from "@/lib/utils";
import type { HTMLAttributes, KeyboardEvent, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { DESIGN_TOKENS } from "@/lib/design-tokens";

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

export type EnterpriseTableInteractiveRowProps = HTMLAttributes<HTMLTableRowElement> & {
  readonly selected?: boolean;
  readonly interactive?: boolean;
  readonly onActivate?: () => void;
};

/** Selectable operator table row with keyboard activation (Enter/Space) and valid selection semantics. */
export function EnterpriseTableInteractiveRow({
  className,
  selected = false,
  interactive = true,
  onActivate,
  onClick,
  onKeyDown,
  children,
  ...rest
}: EnterpriseTableInteractiveRowProps): React.ReactElement {
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    onKeyDown?.(event);

    if (event.defaultPrevented || !interactive || onActivate === undefined) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  }

  return (
    <tr
      className={cn(
        DESIGN_TOKENS.table.row,
        selected ? DESIGN_TOKENS.table.rowSelected : null,
        interactive ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" : null,
        className,
      )}
      role="row"
      tabIndex={interactive ? 0 : undefined}
      aria-selected={interactive ? selected : undefined}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented && interactive) {
          onActivate?.();
        }
      }}
      onKeyDown={handleKeyDown}
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
