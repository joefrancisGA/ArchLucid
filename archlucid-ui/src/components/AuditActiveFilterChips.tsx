"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { DismissibleActiveFilterChip } from "@/components/ui/dismissible-active-filter-chip";
import { AUDIT_TRAIL_ACTIVE_FILTER_CLEAR } from "@/lib/audit-trail-page-copy";

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
      <span className={cn("text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Active filters:</span>
      {chips.map((chip) => (
        <DismissibleActiveFilterChip
          key={chip.id}
          label={chip.label}
          onDismiss={() => {
            onClearChip(chip.id);
          }}
          testId={`audit-active-filter-chip-${chip.id}`}
          dismissLabel={`Remove ${chip.label}`}
        />
      ))}
      <Button type="button" variant="outline" size="sm" className="h-7" onClick={onClearAll}>
        {AUDIT_TRAIL_ACTIVE_FILTER_CLEAR}
      </Button>
    </div>
  );
}
