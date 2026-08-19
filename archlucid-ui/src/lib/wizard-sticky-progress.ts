import { cn } from "@/lib/utils";

import { OPERATOR_SHELL_STICKY_TOP_CLASS } from "@/lib/design-tokens";

/**
 * Sticky wizard step / progress chrome (TB-2198).
 * Clears the measured operator shell header via {@link OPERATOR_SHELL_STICKY_TOP_CLASS}.
 * Enterprise density only — not marketing sticky hero treatment.
 */
export const WIZARD_STICKY_PROGRESS_CLASS = cn(
  "sticky z-20",
  OPERATOR_SHELL_STICKY_TOP_CLASS,
  "-mx-1 mb-0 px-1 py-2",
  "border-b border-neutral-200/80 bg-neutral-50/95 backdrop-blur",
  "supports-[backdrop-filter]:bg-neutral-50/85",
  "dark:border-neutral-800/80 dark:bg-neutral-950/95",
  "dark:supports-[backdrop-filter]:bg-neutral-950/85",
);

/** Stable selector for sticky progress chrome (shared WizardStepper + long wizards). */
export const WIZARD_STICKY_PROGRESS_TEST_ID = "wizard-sticky-progress";