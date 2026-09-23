"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type SetStateAction } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

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
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { cn } from "@/lib/utils";

export type SimulatorModeTopBarChipProps = {
  readonly className?: string;
};

/**
 * Dev-only analysis mode control — explicit button + confirmation; never styled as passive status.
 */
export function SimulatorModeTopBarChip(props: SimulatorModeTopBarChipProps): ReactElement | null {
  const pathname = usePathname() ?? "/";
  const { mode, isSimulator, isLoading } = useAgentExecutionMode();
  const readiness = useSessionAiReadiness();
  const healthQuery = useHealthReadySummaryQuery();
  const [devOverride, setDevOverride] = useState<DevAgentExecutionModeOverride | null>(null);
  const [confirmOpen, setConfirmOpenState] = useState(() =>
    parseSimulatorModeConfirmOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("simulatorModeConfirmOpen"),
    ),
  );
  const confirmOpenRef = useRef(confirmOpen);
  confirmOpenRef.current = confirmOpen;

  const syncConfirmOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(simulatorModeConfirmHrefFromSearch(readWindowLocationSearch(), open, pathname), {
        notify: false,
      });
    },
    [pathname],
  );

  const setConfirmOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      const current = confirmOpenRef.current;
      const next = typeof value === "function" ? value(current) : value;

      if (current === next) {
        return;
      }

      confirmOpenRef.current = next;
      setConfirmOpenState(next);
      syncConfirmOpenToUrl(next);
    },
    [syncConfirmOpenToUrl],
  );

  useEffect(() => {
    const syncConfirmOpenFromUrl = (): void => {
      const next = parseSimulatorModeConfirmOpenFromSearch(
        new URLSearchParams(window.location.search).get("simulatorModeConfirmOpen"),
      );

      if (confirmOpenRef.current === next) {
        return;
      }

      confirmOpenRef.current = next;
      setConfirmOpenState(next);
    };

    syncConfirmOpenFromUrl();
    window.addEventListener("popstate", syncConfirmOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncConfirmOpenFromUrl);
    };
  }, []);

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
        className={cn(
          "h-8 max-w-[min(100%,16rem)] shrink-0 gap-1 border border-neutral-300 bg-white px-2.5 dark:border-neutral-600 dark:bg-neutral-900",
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
