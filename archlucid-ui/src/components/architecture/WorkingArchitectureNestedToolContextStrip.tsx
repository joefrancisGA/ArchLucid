"use client";

import {
  WORKING_ARCHITECTURE_NESTED_CONTEXT_STRIP_TEST_ID,
  workingArchitectureNestedContextStrip,
  type WorkingArchitectureNestedToolLabel,
} from "@/lib/architecture/working-architecture-nested-tool-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type WorkingArchitectureNestedToolContextStripProps = {
  readonly toolLabel: WorkingArchitectureNestedToolLabel;
};

/** Working nested tool resume context — what job this surface continues on the architecture desk. */
export function WorkingArchitectureNestedToolContextStrip(
  props: WorkingArchitectureNestedToolContextStripProps,
): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid={WORKING_ARCHITECTURE_NESTED_CONTEXT_STRIP_TEST_ID}
    >
      {workingArchitectureNestedContextStrip(props.toolLabel)}
    </p>
  );
}
