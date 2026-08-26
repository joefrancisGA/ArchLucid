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
          "inline-flex animate-pulse items-center gap-1.5 rounded-md border-2 border-amber-700 bg-amber-400 px-2.5 py-1 font-extrabold uppercase tracking-[0.12em] text-amber-950 shadow-[0_0_0_2px_rgba(245,158,11,0.45)] dark:border-amber-300 dark:bg-amber-500 dark:text-amber-950",
          OPERATOR_TYPOGRAPHY.badge,
        )}
        role="status"
        aria-live="polite"
        data-testid="simulator-mode-top-bar-chip-label"
      >
        <span
          aria-hidden
          className="inline-block size-2 shrink-0 rounded-full bg-amber-900 dark:bg-amber-950"
        />
        {SIMULATOR_MODE_TOP_BAR_CHIP_LABEL}
      </span>
      <FieldHelpTooltip label={SIMULATOR_MODE_TOP_BAR_CHIP_LABEL} hint={SIMULATOR_MODE_TOP_BAR_CHIP_DETAIL} />
    </span>
  );
}
