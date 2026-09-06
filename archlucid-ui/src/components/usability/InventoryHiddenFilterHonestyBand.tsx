"use client";

import { Button } from "@/components/ui/button";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  INVENTORY_HIDDEN_FILTER_SHOW_ALL_LABEL,
  type InventoryHiddenFilterHonesty,
} from "@/lib/inventory-hidden-filter-honesty";
import { cn } from "@/lib/utils";

export type InventoryHiddenFilterHonestyBandProps = {
  readonly honesty: InventoryHiddenFilterHonesty;
  readonly onShowAll: () => void;
  readonly testId?: string;
};

/** Persistent inventory filter honesty — not a native title tooltip (DA-08 / CA-40). */
export function InventoryHiddenFilterHonestyBand(
  props: InventoryHiddenFilterHonestyBandProps,
): React.JSX.Element | null {
  if (!props.honesty.hasHidden || props.honesty.line === null) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/50"
      data-testid={props.testId ?? "inventory-hidden-filter-honesty-band"}
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
        data-testid="inventory-hidden-filter-show-all"
        onClick={props.onShowAll}
      >
        {INVENTORY_HIDDEN_FILTER_SHOW_ALL_LABEL}
      </Button>
    </div>
  );
}
