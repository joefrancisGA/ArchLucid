"use client";

import { Button } from "@/components/ui/button";

export type AuditActiveFilterChip = {
  id: string;
  label: string;
};

export type AuditActiveFilterChipsProps = {
  readonly chips: readonly AuditActiveFilterChip[];
  readonly onClearChip: (id: string) => void;
  readonly onClearAll: () => void;
};

/** Shows active audit filters as removable chips with a result-context summary. */
export function AuditActiveFilterChips(props: AuditActiveFilterChipsProps): React.JSX.Element | null {
  const { chips, onClearChip, onClearAll } = props;

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="audit-active-filter-chips" role="status">
      <span className="text-xs text-neutral-500">Active filters:</span>
      {chips.map((chip) => (
        <Button
          key={chip.id}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => {
            onClearChip(chip.id);
          }}
        >
          {chip.label}
          <span aria-hidden>×</span>
        </Button>
      ))}
      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}
