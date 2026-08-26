"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
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
  REAL_MODE_TOP_BAR_CHIP_DETAIL,
  REAL_MODE_TOP_BAR_CHIP_LABEL,
  SIMULATOR_MODE_TOP_BAR_CHIP_DETAIL,
  SIMULATOR_MODE_TOP_BAR_CHIP_LABEL,
} from "@/lib/simulator-mode-chrome-copy";
import { cn } from "@/lib/utils";

export type SimulatorModeTopBarChipProps = {
  readonly className?: string;
};

/**
 * Persistent, intentionally loud execution-mode indicator in the operator shell top bar.
 * Hidden when the host starts in Real mode with no dev override; toggles Simulator ↔ Real in local dev.
 */
export function SimulatorModeTopBarChip(props: SimulatorModeTopBarChipProps): ReactElement | null {
  const { mode, isSimulator, isLoading } = useAgentExecutionMode();
  const healthQuery = useHealthReadySummaryQuery();
  const [devOverride, setDevOverride] = useState<DevAgentExecutionModeOverride | null>(null);

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

  if (!showChip || mode === null) {
    return null;
  }

  const canToggle = isDevTestingOverridesEnabled();
  const label = isSimulator ? SIMULATOR_MODE_TOP_BAR_CHIP_LABEL : REAL_MODE_TOP_BAR_CHIP_LABEL;
  const detail = isSimulator ? SIMULATOR_MODE_TOP_BAR_CHIP_DETAIL : REAL_MODE_TOP_BAR_CHIP_DETAIL;

  const chipClassName = isSimulator
    ? "border-red-700 bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.55)] dark:border-red-300 dark:bg-red-600"
    : "border-emerald-700 bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.55)] dark:border-emerald-300 dark:bg-emerald-600";

  const dotClassName = isSimulator
    ? "bg-red-100 dark:bg-red-200"
    : "bg-emerald-100 dark:bg-emerald-200";

  const chipBody = (
    <>
      <span
        aria-hidden
        className={cn("inline-block size-2 shrink-0 animate-pulse rounded-full", dotClassName)}
      />
      {label}
    </>
  );

  return (
    <span
      className={cn("inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 sm:max-w-none", props.className)}
      data-testid="simulator-mode-top-bar-chip"
    >
      {canToggle ? (
        <button
          type="button"
          className={cn(
            "inline-flex animate-pulse cursor-pointer items-center gap-1.5 rounded-md border-2 px-2.5 py-1 font-extrabold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",
            chipClassName,
            OPERATOR_TYPOGRAPHY.badge,
          )}
          aria-pressed={!isSimulator}
          aria-label={`${label} mode — click to switch`}
          data-testid="simulator-mode-top-bar-chip-toggle"
          onClick={() => {
            toggleDevAgentExecutionModeFromChip(mode);
          }}
        >
          {chipBody}
        </button>
      ) : (
        <span
          className={cn(
            "inline-flex animate-pulse items-center gap-1.5 rounded-md border-2 px-2.5 py-1 font-extrabold uppercase tracking-[0.12em] text-white",
            chipClassName,
            OPERATOR_TYPOGRAPHY.badge,
          )}
          role="status"
          aria-live="polite"
          data-testid="simulator-mode-top-bar-chip-label"
        >
          {chipBody}
        </span>
      )}
      <FieldHelpTooltip label={label} hint={detail} />
    </span>
  );
}
