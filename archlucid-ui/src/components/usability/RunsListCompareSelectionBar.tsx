"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type RunsListCompareSelectionBarProps = {
  readonly selectedRunIds: readonly string[];
  readonly selectionNotice?: string | null;
  readonly onClear: () => void;
  readonly className?: string;
};

/** Toolbar for comparing two selected reviews from the reviews list. */
export function RunsListCompareSelectionBar(props: RunsListCompareSelectionBarProps): React.JSX.Element | null {
  const count = props.selectedRunIds.length;

  if (count === 0) {
    return null;
  }

  const canCompare = count === 2;
  const compareHref =
    canCompare
      ? comparePageHrefAdaptive(props.selectedRunIds[0]!, props.selectedRunIds[1]!)
      : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-700",
        props.className,
      )}
      data-testid="runs-list-compare-selection-bar"
      role="status"
    >
      <span className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-primary")}>
        {count} review{count === 1 ? "" : "s"} selected
        {count === 1 ? " — select one more to compare" : null}
      </span>
      {props.selectionNotice !== null && props.selectionNotice !== undefined && props.selectionNotice.length > 0 ? (
        <p className={cn("m-0 w-full text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {props.selectionNotice}
        </p>
      ) : null}
      {canCompare && compareHref !== null ? (
        <Button asChild size="sm" variant="primary">
          <Link href={compareHref} data-testid="runs-list-compare-selected">
            Compare selected
          </Link>
        </Button>
      ) : null}
      <Button type="button" size="sm" variant="outline" onClick={props.onClear}>
        Clear selection
      </Button>
    </div>
  );
}
