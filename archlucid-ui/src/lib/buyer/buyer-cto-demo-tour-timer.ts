import { BUYER_CTO_DEMO_STEP_BUDGET_MINUTES } from "@/lib/buyer/buyer-cto-demo-tour-storage";

function clampCtoDemoStepIndex(stepIndex: number): number {
  return Math.max(0, Math.min(stepIndex, BUYER_CTO_DEMO_STEP_BUDGET_MINUTES.length - 1));
}

/** Minutes remaining from the current step through the end of the 30-minute demo script. */
export function buyerCtoDemoRemainingBudgetMinutes(stepIndex: number): number {
  const safeIndex = clampCtoDemoStepIndex(stepIndex);

  return BUYER_CTO_DEMO_STEP_BUDGET_MINUTES.slice(safeIndex).reduce((sum, minutes) => sum + minutes, 0);
}

export type CtoDemoStepTimerState = {
  readonly display: string;
  readonly isOvertime: boolean;
};

/** Formats remaining seconds for the live step countdown (M:SS or +M:SS over). */
export function formatCtoDemoStepTimer(remainingSeconds: number): CtoDemoStepTimerState {
  if (remainingSeconds < 0) {
    const over = Math.abs(remainingSeconds);
    const minutes = Math.floor(over / 60);
    const seconds = over % 60;

    return {
      display: `+${minutes}:${String(seconds).padStart(2, "0")} over`,
      isOvertime: true,
    };
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return {
    display: `${minutes}:${String(seconds).padStart(2, "0")}`,
    isOvertime: false,
  };
}

export function buyerCtoDemoStepBudgetSeconds(stepIndex: number): number {
  const safeIndex = clampCtoDemoStepIndex(stepIndex);
  const minutes = BUYER_CTO_DEMO_STEP_BUDGET_MINUTES[safeIndex] ?? 0;

  return minutes * 60;
}

/** Presenter-facing label for the current step pacing budget (e.g. "Budget: 6 min"). */
export function formatCtoDemoStepBudgetLabel(stepIndex: number): string {
  const safeIndex = clampCtoDemoStepIndex(stepIndex);
  const minutes = BUYER_CTO_DEMO_STEP_BUDGET_MINUTES[safeIndex] ?? 0;

  return `Budget: ${minutes} min`;
}
