"use client";

import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useLlmMonthlyBudgetStatusQuery } from "@/hooks/use-llm-monthly-budget-status-query";
import { useDocumentHidden } from "@/lib/document-visibility";

/**
 * Sole refetchInterval observer for `operator/llm/monthly-budget-status`.
 * Banners and pills subscribe with polling disabled and read this cache.
 */
export function LlmMonthlyBudgetStatusPollOwner() {
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const documentHidden = useDocumentHidden();

  useLlmMonthlyBudgetStatusQuery({
    enabled: concernFetchEnabled,
    documentHidden,
    pollOwner: true,
  });

  return null;
}
