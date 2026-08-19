import { cn } from "@/lib/utils";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

/** Tab list chrome for pill variant — matches `/architecture/reviews` filter row spacing. */
export const TABS_PILL_LIST_CLASS =
  "flex flex-wrap gap-1.5 border-0 pb-0 dark:border-0";

/** Pill tab trigger — same silver pill as Reviews hub `FilterChip` filters. */
export function tabsPillTriggerClass(selected: boolean, disabled: boolean = false): string {
  return cn(
    DESIGN_TOKENS.interactive.chip,
    DESIGN_TOKENS.accent.focusRing,
    buyerFilterChipClass(selected, disabled),
    "mb-0 -mb-px border-b-0 font-medium leading-none",
  );
}
