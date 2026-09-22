"use client";

import { WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT } from "@/lib/architecture/working-architecture-nested-tool-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Non-teaching keyboard discoverability for Working nested architecture tools. */
export function WorkingArchitectureNestedKeyboardHint(): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="working-architecture-nested-keyboard-hint"
    >
      {WORKING_ARCHITECTURE_NESTED_KEYBOARD_HINT}
    </p>
  );
}
