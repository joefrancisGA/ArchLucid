"use client";

import type { ReactElement } from "react";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { useAgentExecutionMode } from "@/hooks/use-agent-execution-mode";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SIMULATOR_MODE_TOP_BAR_CHIP_DETAIL,
  SIMULATOR_MODE_TOP_BAR_CHIP_LABEL,
} from "@/lib/simulator-mode-chrome-copy";
import { cn } from "@/lib/utils";

export type SimulatorModeTopBarChipProps = {
  readonly className?: string;
};

/**
 * Persistent, intentionally loud simulator indicator in the operator shell top bar.
 * Hidden when the host runs in Real mode or mode is still loading.
 */
export function SimulatorModeTopBarChip(props: SimulatorModeTopBarChipProps): ReactElement | null {
  const { isSimulator, isLoading } = useAgentExecutionMode();

  if (isLoading || !isSimulator) {
    return null;
  }

  return (
    <span
      className={cn("inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 sm:max-w-none", props.className)}
      data-testid="simulator-mode-top-bar-chip"
    >
      <span
        className={cn(
          "inline-flex animate-pulse items-center gap-1.5 rounded-md border-2 border-red-700 bg-red-500 px-2.5 py-1 font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_0_0_2px_rgba(239,68,68,0.55)] dark:border-red-300 dark:bg-red-600 dark:text-white",
          OPERATOR_TYPOGRAPHY.badge,
        )}
        role="status"
        aria-live="polite"
        data-testid="simulator-mode-top-bar-chip-label"
      >
        <span
          aria-hidden
          className="inline-block size-2 shrink-0 animate-pulse rounded-full bg-red-100 dark:bg-red-200"
        />
        {SIMULATOR_MODE_TOP_BAR_CHIP_LABEL}
      </span>
      <FieldHelpTooltip label={SIMULATOR_MODE_TOP_BAR_CHIP_LABEL} hint={SIMULATOR_MODE_TOP_BAR_CHIP_DETAIL} />
    </span>
  );
}
