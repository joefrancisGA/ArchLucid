"use client";

import type { ReactElement } from "react";

import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SIMULATOR_MODE_AI_OPERATION_NOTICE_BODY,
  SIMULATOR_MODE_AI_OPERATION_NOTICE_TITLE,
} from "@/lib/simulator-mode-chrome-copy";
import { cn } from "@/lib/utils";

export type SimulatorModeAiOperationNoticeProps = {
  readonly className?: string;
  readonly testId?: string;
};

/**
 * Prominent post-operation warning when AI output was produced under simulator execution mode.
 */
export function SimulatorModeAiOperationNotice(
  props: SimulatorModeAiOperationNoticeProps,
): ReactElement | null {
  const { isSimulator } = useAgentExecutionMode();

  if (!isSimulator) {
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
      data-testid={props.testId ?? "simulator-mode-ai-operation-notice"}
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
