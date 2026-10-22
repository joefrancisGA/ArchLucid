"use client";

import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";

/** LLM monthly budget gate for wizard submit / quick-start surfaces. */
export function useNewRunWizardLlmBudgetGate() {
  return useLlmMonthlyBudgetExecutionGate();
}
