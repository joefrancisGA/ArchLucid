"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Button } from "@/components/ui/button";
import { OPERATOR_ADVANCED_MODE } from "@/lib/nav-disclosure-copy";

type OperatorAdvancedModeToggleProps = {
  advancedModeOn: boolean;
  onToggle: () => void;
  testId?: string;
  className?: string;
  showFootnote?: boolean;
};

/**
 * Single progressive-disclosure control for V1 — turns on extended + advanced nav tiers together.
 */
export function OperatorAdvancedModeToggle({
  advancedModeOn,
  onToggle,
  testId = "operator-advanced-mode-toggle",
  className,
  showFootnote = true,
}: OperatorAdvancedModeToggleProps) {
  return (
    <div className="space-y-2" data-testid={`${testId}-wrap`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={
          className ??
          (cn("sidebar-disclosure-trigger w-full justify-start px-3 py-2 text-left font-medium text-neutral-900 shadow-none hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper))
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
      {showFootnote && !advancedModeOn ? (
        <p className={cn("m-0 px-1 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {OPERATOR_ADVANCED_MODE.footnote}
        </p>
      ) : null}
    </div>
  );
}
