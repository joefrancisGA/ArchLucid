"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type DismissibleActiveFilterChipProps = {
  readonly label: string;
  readonly onDismiss: () => void;
  readonly testId: string;
  readonly dismissLabel: string;
};

/** Removable active-filter chip shared across hub, findings, audit, and home strips. */
export function DismissibleActiveFilterChip(
  props: DismissibleActiveFilterChipProps,
): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-0.5 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid={props.testId}
    >
      <span>{props.label}</span>
      <button
        type="button"
        className="rounded px-1 text-al-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800"
        aria-label={props.dismissLabel}
        onClick={props.onDismiss}
        data-testid={`${props.testId}-dismiss`}
      >
        ×
      </button>
    </span>
  );
}
