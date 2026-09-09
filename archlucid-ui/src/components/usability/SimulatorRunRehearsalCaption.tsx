"use client";

import type { ReactElement } from "react";

import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isRehearsalStructuralExecutionMode } from "@/lib/governance/simulator-career-honesty";
import {
  SIMULATOR_MODE_AI_OPERATION_NOTICE_BODY,
  SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE,
} from "@/lib/simulator-mode-chrome-copy";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import { cn } from "@/lib/utils";

export type SimulatorRunRehearsalCaptionProps = {
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly className?: string;
  readonly testId?: string;
};

/**
 * Persistent rehearsal caption for Simulator/Fallback runs (LP-06).
 * Uses run structural mode when available; falls back to host session mode for in-flight reviews.
 */
export function SimulatorRunRehearsalCaption(
  props: SimulatorRunRehearsalCaptionProps,
): ReactElement | null {
  const { isSimulator: hostSimulator } = useAgentExecutionMode();
  const runRehearsal =
    props.structuralExecutionMode !== undefined
      && isRehearsalStructuralExecutionMode(props.structuralExecutionMode);
  const showCaption = runRehearsal || (props.structuralExecutionMode === undefined && hostSimulator);

  if (!showCaption) {
    return null;
  }

  return (
    <div
      className={cn(
        DESIGN_TOKENS.callout.warn,
        "border-2 border-amber-600 bg-amber-100 p-3 dark:border-amber-400 dark:bg-amber-950/50",
        props.className,
      )}
      role="status"
      data-testid={props.testId ?? "simulator-run-rehearsal-caption"}
    >
      <p className={cn("m-0 font-bold uppercase tracking-wide text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
        {SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE}
      </p>
      <p className={cn("m-0 mt-1 text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}>
        {SIMULATOR_MODE_AI_OPERATION_NOTICE_BODY}
      </p>
    </div>
  );
}
