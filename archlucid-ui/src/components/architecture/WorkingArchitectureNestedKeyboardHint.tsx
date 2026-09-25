"use client";

import {
  workingArchitectureNestedKeyboardHint,
  type WorkingArchitectureNestedToolLabel,
} from "@/lib/architecture/working-architecture-nested-tool-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type WorkingArchitectureNestedKeyboardHintProps = {
  readonly toolLabel: WorkingArchitectureNestedToolLabel;
};

/** Non-teaching keyboard discoverability for Working nested architecture tools. */
export function WorkingArchitectureNestedKeyboardHint(
  props: WorkingArchitectureNestedKeyboardHintProps,
): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="working-architecture-nested-keyboard-hint"
    >
      {workingArchitectureNestedKeyboardHint(props.toolLabel)}
    </p>
  );
}
