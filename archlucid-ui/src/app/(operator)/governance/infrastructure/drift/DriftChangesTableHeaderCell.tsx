"use client";

import { Filter } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EnterpriseTableHeaderCell } from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DriftTableSortDir } from "@/lib/infra-evidence/infra-evidence-drift-table-filter";
import { OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const cnField =
  "rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

export type DriftChangesTableHeaderFilterOption = {
  readonly value: string;
  readonly label: string;
};

export type DriftChangesTableHeaderFilterConfig =
  | {
      readonly kind: "text";
      readonly value: string;
      readonly placeholder?: string;
      readonly filterTestId: string;
      readonly onApply: (value: string) => void;
      readonly onClear: () => void;
    }
  | {
      readonly kind: "select";
      readonly value: string;
      readonly options: readonly DriftChangesTableHeaderFilterOption[];
      readonly filterTestId: string;
      readonly onChange: (value: string) => void;
      readonly onClear: () => void;
    };

export type DriftChangesTableHeaderCellProps = {
  readonly column: string;
  readonly label: string;
  readonly sortBy: string;
  readonly sortDir: DriftTableSortDir;
  readonly sortDirection: "ascending" | "descending" | "none";
  readonly onSort: () => void;
  readonly filter?: DriftChangesTableHeaderFilterConfig;
};

function DriftChangesTableHeaderFilterPanel(props: {
  readonly filter: DriftChangesTableHeaderFilterConfig;
  readonly onClose: () => void;
}): React.JSX.Element {
  const { filter, onClose } = props;
  const [draftValue, setDraftValue] = useState(filter.kind === "text" ? filter.value : "");

  useEffect(() => {
    if (filter.kind === "text") {
      setDraftValue(filter.value);
    }
  }, [filter]);

  if (filter.kind === "select") {
    return (
      <div className="grid gap-2">
        <Label className={OPERATOR_FORM_FIELD_LABEL_CLASS} htmlFor={`${filter.filterTestId}-select`}>
          Filter
        </Label>
        <select
          id={`${filter.filterTestId}-select`}
          className={cnField}
          data-testid={filter.filterTestId}
          value={filter.value}
          onChange={(event) => {
            filter.onChange(event.target.value);
          }}
        >
          {filter.options.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid={`${filter.filterTestId}-clear`}
            onClick={() => {
              filter.onClear();
              onClose();
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Label className={OPERATOR_FORM_FIELD_LABEL_CLASS} htmlFor={`${filter.filterTestId}-input`}>
        Contains
      </Label>
      <Input
        id={`${filter.filterTestId}-input`}
        className={cnField}
        data-testid={filter.filterTestId}
        value={draftValue}
        placeholder={filter.placeholder}
        onChange={(event) => {
          setDraftValue(event.target.value);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          data-testid={`${filter.filterTestId}-apply`}
          onClick={() => {
            filter.onApply(draftValue);
            onClose();
          }}
        >
          Apply
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid={`${filter.filterTestId}-clear`}
          onClick={() => {
            setDraftValue("");
            filter.onClear();
            onClose();
          }}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}

export function DriftChangesTableHeaderCell(props: DriftChangesTableHeaderCellProps): React.JSX.Element {
  const isActiveSort = props.sortBy === props.column;
  const directionLabel = props.sortDir === "asc" ? "ascending" : "descending";
  const filterActive = props.filter != null && props.filter.value.trim().length > 0;
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <EnterpriseTableHeaderCell sortDirection={props.sortDirection}>
      {/* inline-flex (not flex-1) keeps the filter icon beside this column label instead of the cell's far edge. */}
      <div
        className="inline-flex max-w-full items-center gap-0.5"
        data-testid={`infra-drift-header-cluster-${props.column}`}
      >
        <button
          type="button"
          className={cn(
            "inline-flex min-w-0 items-center gap-1 text-left font-inherit hover:text-al-text-primary",
            isActiveSort ? "text-al-text-primary" : "text-al-text-secondary",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid={`infra-drift-sort-${props.column}`}
          aria-label={isActiveSort ? `Sort by ${props.label}, ${directionLabel}` : `Sort by ${props.label}`}
          onClick={props.onSort}
        >
          <span className="truncate">{props.label}</span>
          {isActiveSort ? (
            <span aria-hidden className="shrink-0 text-al-text-primary">
              {props.sortDir === "asc" ? "↑" : "↓"}
            </span>
          ) : null}
        </button>
        {props.filter != null ? (
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-al-text-secondary hover:bg-neutral-100 hover:text-al-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2 dark:hover:bg-neutral-800",
                  filterActive ? "text-al-text-primary" : null,
                )}
                data-testid={`${props.filter.filterTestId}-trigger`}
                aria-label={`Filter ${props.label}`}
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 p-3">
              <DriftChangesTableHeaderFilterPanel
                filter={props.filter}
                onClose={() => {
                  setFilterOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
    </EnterpriseTableHeaderCell>
  );
}
