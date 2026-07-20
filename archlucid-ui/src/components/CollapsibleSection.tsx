"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  /** When true, section starts expanded. */
  defaultOpen?: boolean;
  /** Optional one-line preview under the title in the summary row. */
  summaryLine?: string;
  /** Optional id for the `<summary>` (pairs with parent `aria-labelledby`). */
  summaryId?: string;
  /** Optional stable hook for E2E (placed on the root `<details>`). */
  sectionTestId?: string;
  /** Called when the native `<details>` open state changes. */
  onToggle?: (open: boolean) => void;
  children: ReactNode;
};

/**
 * Progressive disclosure using native <details>; avoids extra Radix dependency.
 * Prefer for long run-detail sections (explanation, artifacts).
 */
export function CollapsibleSection({
  title,
  defaultOpen = false,
  summaryLine,
  summaryId,
  sectionTestId,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <details
      className="mb-6 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid={sectionTestId}
      data-workspace-disclosure
      open={defaultOpen}
      onToggle={(event) => {
        if (onToggle !== undefined) {
          onToggle((event.currentTarget as HTMLDetailsElement).open);
        }
      }}
    >
      <summary
        id={summaryId}
        className={cn("cursor-pointer select-none text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        <span className="font-semibold">{title}</span>
        {summaryLine !== undefined && summaryLine.trim().length > 0 ? (
          <span className={cn("mt-1 block font-normal text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {summaryLine}
          </span>
        ) : null}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
