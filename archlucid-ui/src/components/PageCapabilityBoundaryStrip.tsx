"use client";

import type { JSX } from "react";

import {
  getPageCapabilityBoundary,
  type PageCapabilityBoundary,
  type PageCapabilityBoundarySurfaceId,
} from "@/lib/page-capability-boundary";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type PageCapabilityBoundaryStripProps = {
  readonly surfaceId: PageCapabilityBoundarySurfaceId;
  readonly className?: string;
  /** Optional override for tests; defaults to {@link getPageCapabilityBoundary}. */
  readonly boundary?: PageCapabilityBoundary;
};

/**
 * TB-2197 - compact disclosure listing what the current page does not do.
 * Reuses enterprise details chrome (same pattern as CompareHowComparisonWorksSection).
 */
export function PageCapabilityBoundaryStrip(
  props: PageCapabilityBoundaryStripProps,
): JSX.Element {
  const boundary = props.boundary ?? getPageCapabilityBoundary(props.surfaceId);

  return (
    <details
      className={cn(
        "mb-4 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      data-testid="page-capability-boundary"
      data-surface-id={props.surfaceId}
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        {boundary.heading}
      </summary>
      <ul
        className={cn(
          "m-0 mt-2 list-disc space-y-1 pl-4 text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        {boundary.items.map((item) => (
          <li key={item} className="leading-snug">
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}
