"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { NewRunWizardMode } from "./use-new-run-wizard-mode";

type NewRunWizardModeToggleProps = {
  readonly wizardMode: NewRunWizardMode;
  readonly quickModeLabel: string;
  readonly fullWizardStepCount: number;
  /** False until the tenant has a committed review, when quick start is simply recommended. */
  readonly showToggle: boolean;
  readonly onModeChange: (mode: NewRunWizardMode) => void;
  readonly onAdvancedOptIn: () => void;
};

const SELECTED_CLASS = "rounded-md bg-[var(--al-primary-action-bg)] px-3 py-1.5 text-white";
const UNSELECTED_CLASS =
  "rounded-md px-3 py-1.5 text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-100 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800";

function modeButtonClass(selected: boolean): string {
  return selected
    ? cn(SELECTED_CLASS, OPERATOR_TYPOGRAPHY.button)
    : cn(UNSELECTED_CLASS, OPERATOR_TYPOGRAPHY.body);
}

/** Quick start vs. all steps — or, before the first committed review, an opt-in to all steps. */
export function NewRunWizardModeToggle(props: NewRunWizardModeToggleProps): React.JSX.Element {
  if (!props.showToggle) {
    return (
      <div
        className="rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="new-run-wizard-advanced-opt-in"
      >
        <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">Quick start (3 steps)</span>
          {" — recommended for your first review. Constraints, optional evidence, and advanced fields use safe defaults."}
        </p>
        <button
          type="button"
          className={cn(
            "mt-2 rounded-md px-3 py-1.5 text-al-text-primary underline decoration-neutral-400 underline-offset-2 hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-900/60",
            OPERATOR_TYPOGRAPHY.button,
          )}
          onClick={props.onAdvancedOptIn}
        >
          Show all wizard steps (advanced configuration)
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      role="group"
      aria-label="Steps inside full guided review"
      data-testid="new-run-wizard-mode-toggle"
    >
      <span
        className={cn("font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
      >
        Inside full guided review
      </span>
      <button
        type="button"
        className={modeButtonClass(props.wizardMode === "quick")}
        aria-pressed={props.wizardMode === "quick"}
        onClick={() => props.onModeChange("quick")}
      >
        {props.quickModeLabel}
      </button>
      <button
        type="button"
        className={modeButtonClass(props.wizardMode === "full")}
        aria-pressed={props.wizardMode === "full"}
        onClick={() => props.onModeChange("full")}
      >
        All steps ({props.fullWizardStepCount})
      </button>
    </div>
  );
}
