"use client";

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
import { StatusTag } from "@/components/ui/status-tag";
import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { useSessionAiReadiness } from "@/hooks/session-ai-readiness-context";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { DEV_CHROME_SURFACE_CLASS } from "@/lib/dev-chrome-treatment";
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
import {
  parseSimulatorModeConfirmOpenFromSearch,
  simulatorModeConfirmHrefFromSearch,
} from "@/lib/operator/simulator-mode-confirm-url";
import { cn } from "@/lib/utils";

export type SimulatorModeTopBarChipProps = {
  readonly className?: string;
};

/**
 * Dev-only analysis mode control — explicit button + confirmation; never styled as passive status.
 */
export function SimulatorModeTopBarChip(props: SimulatorModeTopBarChipProps): ReactElement | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const simulatorModeConfirmOpenParam = searchParams.get("simulatorModeConfirmOpen");
  const { mode, isSimulator, isLoading } = useAgentExecutionMode();
  const readiness = useSessionAiReadiness();
  const healthQuery = useHealthReadySummaryQuery();
  const [devOverride, setDevOverride] = useState<DevAgentExecutionModeOverride | null>(null);
  const [confirmOpen, setConfirmOpenState] = useState(() =>
    parseSimulatorModeConfirmOpenFromSearch(simulatorModeConfirmOpenParam),
  );

  const setConfirmOpen = useCallback((open: boolean) => {
    setConfirmOpenState(open);
  }, []);

  useEffect(() => {
    setConfirmOpenState(parseSimulatorModeConfirmOpenFromSearch(simulatorModeConfirmOpenParam));
  }, [simulatorModeConfirmOpenParam]);

  useEffect(() => {
    const urlOpen = parseSimulatorModeConfirmOpenFromSearch(simulatorModeConfirmOpenParam);

    if (confirmOpen === urlOpen) {
      return;
    }

    router.replace(simulatorModeConfirmHrefFromSearch(searchParams.toString(), confirmOpen, pathname), {
      scroll: false,
    });
  }, [confirmOpen, pathname, router, searchParams, simulatorModeConfirmOpenParam]);

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
      <StatusTag
        kind="neutral"
        label="Dev"
        className="shrink-0"
        data-testid="dev-environment-top-bar-tag"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8 max-w-[min(100%,16rem)] shrink-0 gap-1 px-2.5",
          DEV_CHROME_SURFACE_CLASS,
          props.className,
        )}
        data-testid="simulator-mode-top-bar-chip-toggle"
        aria-haspopup="dialog"
        onClick={() => {
          setConfirmOpen(true);
        }}
      >
        {buttonLabel}
        <ChevronDown className="size-3.5 shrink-0 opacity-80" aria-hidden />
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
                setConfirmOpen(false);
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
