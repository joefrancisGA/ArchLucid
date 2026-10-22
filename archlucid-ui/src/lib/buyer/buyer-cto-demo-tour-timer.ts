import { BUYER_CTO_DEMO_STEP_BUDGET_MINUTES } from "@/lib/buyer/buyer-cto-demo-tour-storage";

function isCtoDemoStepIndexInRange(stepIndex: number): boolean {
  return Number.isInteger(stepIndex)
    && stepIndex >= 0
    && stepIndex < BUYER_CTO_DEMO_STEP_BUDGET_MINUTES.length;
}

/** Minutes remaining from the current step through the end of the 30-minute demo script. */
export function buyerCtoDemoRemainingBudgetMinutes(stepIndex: number): number {
  if (!isCtoDemoStepIndexInRange(stepIndex)) {
    return 0;
  }

  return BUYER_CTO_DEMO_STEP_BUDGET_MINUTES.slice(stepIndex).reduce((sum, minutes) => sum + minutes, 0);
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
  if (!isCtoDemoStepIndexInRange(stepIndex)) {
    return 0;
  }

  const minutes = BUYER_CTO_DEMO_STEP_BUDGET_MINUTES[stepIndex] ?? 0;

  return minutes * 60;
}

/** Presenter-facing label for the current step pacing budget (e.g. "Budget: 6 min"). */
export function formatCtoDemoStepBudgetLabel(stepIndex: number): string {
  if (!isCtoDemoStepIndexInRange(stepIndex)) {
    return "Budget: 0 min";
  }

  const minutes = BUYER_CTO_DEMO_STEP_BUDGET_MINUTES[stepIndex] ?? 0;

  return `Budget: ${minutes} min`;
}
