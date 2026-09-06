"use client";

import { Button } from "@/components/ui/button";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  FINDINGS_HIDDEN_FILTER_SHOW_ALL_LABEL,
  type FindingsHiddenFilterHonesty,
} from "@/lib/findings/findings-hidden-filter-honesty";
import { cn } from "@/lib/utils";

export type FindingsHiddenFilterHonestyBandProps = {
  readonly honesty: FindingsHiddenFilterHonesty;
  readonly onShowAll: () => void;
};

/** Persistent filter honesty — not a native title tooltip (DA-08 / TB-1666). */
export function FindingsHiddenFilterHonestyBand(
  props: FindingsHiddenFilterHonestyBandProps,
): React.JSX.Element | null {
  if (!props.honesty.hasHidden || props.honesty.line === null) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/50"
      data-testid="findings-hidden-filter-honesty-band"
      role="status"
    >
      <p className={cn("m-0 flex-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {props.honesty.line}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={CTA_WIDTH.content}
        data-testid="findings-hidden-filter-show-all"
        onClick={props.onShowAll}
      >
        {FINDINGS_HIDDEN_FILTER_SHOW_ALL_LABEL}
      </Button>
    </div>
  );
}
