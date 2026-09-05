"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { useSessionAiReadiness } from "@/hooks/session-ai-readiness-context";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  isDevTestingOverridesEnabled,
  readDevAgentExecutionModeOverrideFromDocument,
  type DevAgentExecutionModeOverride,
} from "@/lib/dev-testing-overrides";
import {
  shouldShowExecutionModeTopBarChip,
  toggleDevAgentExecutionModeFromChip,
} from "@/lib/execution-mode-top-bar-chip";
import {
  ANALYSIS_MODE_RULE_BASED_LABEL,
  ANALYSIS_MODE_RULE_BASED_SWITCH_PROMPT,
  ANALYSIS_MODE_RULE_BASED_SWITCH_TITLE,
  ANALYSIS_MODE_WORKSPACE_LABEL,
  ANALYSIS_MODE_WORKSPACE_SWITCH_PROMPT,
  ANALYSIS_MODE_WORKSPACE_SWITCH_TITLE,
  resolveAnalysisModeTopBarButtonLabel,
} from "@/lib/simulator-mode-chrome-copy";
import { cn } from "@/lib/utils";

export type SimulatorModeTopBarChipProps = {
  readonly className?: string;
};

/**
 * Dev-only analysis mode control — explicit button + confirmation; never styled as passive status.
 */
export function SimulatorModeTopBarChip(props: SimulatorModeTopBarChipProps): ReactElement | null {
  const { mode, isSimulator, isLoading } = useAgentExecutionMode();
  const readiness = useSessionAiReadiness();
  const healthQuery = useHealthReadySummaryQuery();
  const [devOverride, setDevOverride] = useState<DevAgentExecutionModeOverride | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isDevTestingOverridesEnabled()) {
      return;
    }

    setDevOverride(readDevAgentExecutionModeOverrideFromDocument());
  }, []);

  const showChip = useMemo(
    () =>
      shouldShowExecutionModeTopBarChip({
        isLoading,
        hostAgentExecutionMode: healthQuery.data?.agentExecutionMode,
        devOverride,
      }),
    [devOverride, healthQuery.data?.agentExecutionMode, isLoading],
  );

  if (!showChip || mode === null || !isDevTestingOverridesEnabled()) {
    return null;
  }

  const realNotReady = !isSimulator && readiness.isSessionReal && !readiness.isLoading && !readiness.isReady;
  const buttonLabel = resolveAnalysisModeTopBarButtonLabel(isSimulator, realNotReady);
  const switchTitle = isSimulator ? ANALYSIS_MODE_WORKSPACE_SWITCH_TITLE : ANALYSIS_MODE_RULE_BASED_SWITCH_TITLE;
  const switchPrompt = isSimulator ? ANALYSIS_MODE_WORKSPACE_SWITCH_PROMPT : ANALYSIS_MODE_RULE_BASED_SWITCH_PROMPT;
  const switchTargetLabel = isSimulator ? ANALYSIS_MODE_WORKSPACE_LABEL : ANALYSIS_MODE_RULE_BASED_LABEL;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("h-8 max-w-[min(100%,16rem)] shrink-0 px-2.5", OPERATOR_TYPOGRAPHY.helper, props.className)}
        data-testid="simulator-mode-top-bar-chip-toggle"
        aria-haspopup="dialog"
        onClick={() => {
          setConfirmOpen(true);
        }}
      >
        {buttonLabel}
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent data-testid="analysis-mode-switch-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{switchTitle}</AlertDialogTitle>
            <AlertDialogDescription>{switchPrompt}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toggleDevAgentExecutionModeFromChip(mode);
              }}
            >
              Switch to {switchTargetLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
