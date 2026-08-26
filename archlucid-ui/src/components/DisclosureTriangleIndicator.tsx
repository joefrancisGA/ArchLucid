"use client";

import { cn } from "@/lib/utils";

type DisclosureTriangleIndicatorProps = {
  className?: string;
};

/**
 * Native-details-style triangle for `<details>` summaries when flex layout hides the browser marker.
 * Pair with `group` on the parent `<details>` so `group-open:rotate-90` reflects expanded state.
 */
export function DisclosureTriangleIndicator(props: DisclosureTriangleIndicatorProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "shrink-0 font-bold text-neutral-900 transition-transform group-open:rotate-90 dark:text-neutral-100",
        props.className,
      )}
    >
      ▸
    </span>
  );
}
