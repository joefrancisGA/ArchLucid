"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_ADVANCED_MODE } from "@/lib/nav-disclosure-copy";

type OperatorAdvancedModeToggleProps = {
  advancedModeOn: boolean;
  onToggle: () => void;
  testId?: string;
  className?: string;
};

/**
 * Single progressive-disclosure control for V1 — turns on extended + advanced nav tiers together.
 */
export function OperatorAdvancedModeToggle({
  advancedModeOn,
  onToggle,
  testId = "operator-advanced-mode-toggle",
  className,
}: OperatorAdvancedModeToggleProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={
        className ??
        "sidebar-disclosure-trigger w-full justify-start px-3 py-2 text-left text-xs font-medium text-neutral-900 shadow-none hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
      }
      data-testid={testId}
      aria-pressed={advancedModeOn}
      title={OPERATOR_ADVANCED_MODE.title}
      aria-label={
        advancedModeOn
          ? `${OPERATOR_ADVANCED_MODE.hide}. ${OPERATOR_ADVANCED_MODE.assistiveOn}`
          : `${OPERATOR_ADVANCED_MODE.show}. ${OPERATOR_ADVANCED_MODE.assistiveOff}`
      }
      onClick={onToggle}
    >
      {advancedModeOn ? OPERATOR_ADVANCED_MODE.hide : OPERATOR_ADVANCED_MODE.show}
    </Button>
  );
}
