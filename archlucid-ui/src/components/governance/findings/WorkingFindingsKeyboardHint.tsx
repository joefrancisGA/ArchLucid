"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";

/** Non-teaching keyboard hint for Working-mode findings queues. */
export function WorkingFindingsKeyboardHint() {
  const { isWorkingMode } = useWorkspaceMode();

  if (!isWorkingMode) {
    return null;
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="working-findings-keyboard-hint"
    >
      J/K move · Alt+1 accept · Alt+2 waive · Alt+3 defer
    </p>
  );
}
