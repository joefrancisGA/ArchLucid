"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  /** When set, wraps the visible title in a heading element for outline order. */
  headingLevel?: 2 | 3 | 4;
  /** When true, section starts expanded. */
  defaultOpen?: boolean;
  /** Controlled open state; when set, `defaultOpen` is only used for the initial render. */
  open?: boolean;
  /** Optional one-line preview under the title in the summary row. */
  summaryLine?: string;
  /** Optional id for the `<summary>` (pairs with parent `aria-labelledby`). */
  summaryId?: string;
  /**
   * Distinguishing accessible name when several disclosures on one page share the same
   * visible title (for example a per-row "Technical details").
   */
  summaryAriaLabel?: string;
  /** Optional stable hook for E2E (placed on the root `<details>`). */
  sectionTestId?: string;
  /** Called when the native `<details>` open state changes. */
  onToggle?: (open: boolean) => void;
  /** Optional layout classes on the root `<details>` (for example hub section spacing). */
  className?: string;
  children: ReactNode;
};

/**
 * Progressive disclosure using native <details>; avoids extra Radix dependency.
 * Prefer for long run-detail sections (explanation, artifacts).
 *
 * Open state is React-controlled from `defaultOpen` so toggles stick (a constant
 * `open={defaultOpen}` prop would lock closed sections shut).
 */
export function CollapsibleSection({
  title,
  headingLevel,
  defaultOpen = false,
  open: controlledOpen,
  summaryLine,
  summaryId,
  summaryAriaLabel,
  sectionTestId,
  onToggle,
  className,
  children,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  return (
    <details
      className={cn(
        "mb-6 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950",
        className,
      )}
      data-testid={sectionTestId}
      data-workspace-disclosure
      open={open}
      onToggle={(event) => {
        const nextOpen = (event.currentTarget as HTMLDetailsElement).open;

        if (isControlled) {
          event.preventDefault();
          onToggle?.(!open);

          return;
        }

        setInternalOpen(nextOpen);

        if (onToggle !== undefined) {
          onToggle(nextOpen);
        }
      }}
    >
      <summary
        id={summaryId}
        aria-label={summaryAriaLabel}
        className={cn(
          "flex cursor-pointer select-none flex-wrap items-center gap-x-2 text-al-text-primary",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        {headingLevel === 2 ? (
          <h2 className="m-0 inline font-semibold">{title}</h2>
        ) : headingLevel === 3 ? (
          <h3 className="m-0 inline font-semibold">{title}</h3>
        ) : headingLevel === 4 ? (
          <h4 className="m-0 inline font-semibold">{title}</h4>
        ) : (
          <span className="font-semibold">{title}</span>
        )}
        {summaryLine !== undefined && summaryLine.trim().length > 0 ? (
          <span
            className={cn(
              "mt-1 basis-full font-normal text-al-text-secondary",
              OPERATOR_TYPOGRAPHY.helper,
            )}
          >
            {summaryLine}
          </span>
        ) : null}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
