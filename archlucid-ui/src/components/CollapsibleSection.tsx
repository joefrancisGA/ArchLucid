"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  /** When true, section starts expanded. */
  defaultOpen?: boolean;
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
  sectionTestId,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <details
      className="mb-6 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid={sectionTestId}
      open={defaultOpen}
      onToggle={(event) => {
        if (onToggle !== undefined) {
          onToggle((event.currentTarget as HTMLDetailsElement).open);
        }
      }}
    >
      <summary className={cn("cursor-pointer select-none font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {title}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
