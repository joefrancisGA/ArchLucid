"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";

type ScopeSwitcherProjectOptionButtonProps = {
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
};

/** One selectable workspace/project row in the scope switcher panel. */
export function ScopeSwitcherProjectOptionButton(
  props: ScopeSwitcherProjectOptionButtonProps,
): React.JSX.Element {
  const { label, selected, onSelect } = props;

  return (
    <Button
      type="button"
      variant={selected ? "secondary" : "outline"}
      size="sm"
      className={cn(
        "h-auto min-h-8 w-full justify-start gap-2 px-2 py-1.5 text-left",
        selected
          ? "border border-neutral-300 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800"
          : "border border-transparent",
      )}
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
    >
      <Check
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          selected ? "text-al-text-secondary dark:text-neutral-300" : "text-transparent",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-medium text-neutral-900 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.body,
        )}
      >
        {label}
      </span>
    </Button>
  );
}
