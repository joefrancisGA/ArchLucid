import { apiGet } from "@/lib/api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_GC_MS } from "@/lib/query/operator-query-stale-time";

export const LLM_MONTHLY_DOLLAR_BUDGET_STATUS_PATH = "/v1/admin/llm-monthly-dollar-budget-status";

/** Mirrors `GET /v1/admin/llm-monthly-dollar-budget-status` (camelCase JSON). */
export type LlmMonthlyDollarBudgetStatus = {
  monthlyBudgetMonitoringActive: boolean;
  blocksAdditionalLlmExecution: boolean;
  utcMonth: string;
  hardCutoffUsdPerUtcMonth: number | null;
  effectiveHardCapUsd: number | null;
  purchasedCapBumpUsd: number | null;
  estimatedUsdPressure: number | null;
  assumedNextCallReservationUsd: number | null;
  hardCapUtilizationFraction: number | null;
  warnFraction: number | null;
  remainingBudgetUsd?: number | null;
  workspaceKind?: string | null;
  customerAiProviderConfigured?: boolean;
  /** Server-provided freshness when present; otherwise set client-side after fetch. */
  asOfUtc?: string | null;
};

/** Raw fetch for TanStack Query `queryFn` and imperative callers. */
export async function fetchLlmMonthlyDollarBudgetStatus(
  options?: { readonly signal?: AbortSignal },
): Promise<LlmMonthlyDollarBudgetStatus> {
  return apiGet<LlmMonthlyDollarBudgetStatus>(LLM_MONTHLY_DOLLAR_BUDGET_STATUS_PATH, options);
}

/** Imperative read through the shared TanStack Query cache. */
export async function fetchLlmMonthlyDollarBudgetStatusCached(
  options?: { readonly force?: boolean; readonly signal?: AbortSignal },
): Promise<LlmMonthlyDollarBudgetStatus> {
  const queryClient = getOperatorQueryClient();

  if (options?.force === true) {
    await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.llmMonthlyBudgetStatus });
  }

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.llmMonthlyBudgetStatus,
    queryFn: ({ signal }) =>
      fetchLlmMonthlyDollarBudgetStatus({ signal: options?.signal ?? signal }),
    staleTime: Infinity,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}

/** Clears cached LLM budget status (for example in Vitest). */
export async function invalidateLlmMonthlyBudgetStatusCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({ queryKey: operatorQueryKeys.llmMonthlyBudgetStatus });
}

export type LlmBudgetUtilizationTone = "ok" | "warn" | "critical";

export function resolveLlmBudgetUtilizationTone(
  status: LlmMonthlyDollarBudgetStatus,
): LlmBudgetUtilizationTone {
  const fraction = status.hardCapUtilizationFraction ?? 0;
  const warn = status.warnFraction ?? 0.75;

  if (status.blocksAdditionalLlmExecution || fraction >= 1) {
    return "critical";
  }

  if (fraction >= warn) {
    return "warn";
  }

  return "ok";
}

/**
 * Top-bar chrome shows budget only when headroom is degraded or exhausted.
 * Healthy (ok) remaining budget stays on Administration → AI usage.
 */
export function shouldShowShellLlmBudgetStatusPill(status: LlmMonthlyDollarBudgetStatus): boolean {
  if (!status.monthlyBudgetMonitoringActive) {
    return false;
  }

  const tone = resolveLlmBudgetUtilizationTone(status);

  return tone === "warn" || tone === "critical";
}

export function llmBudgetUtilizationPercent(status: LlmMonthlyDollarBudgetStatus): number | null {
  if (!status.monthlyBudgetMonitoringActive) {
    return null;
  }

  const fraction = status.hardCapUtilizationFraction;

  if (fraction === null || fraction === undefined || Number.isNaN(fraction)) {
    return null;
  }

  return Math.min(100, Math.round(fraction * 1000) / 10);
}

/** Buyer-safe headroom under the UTC-month hard cap (100 minus utilization, floored at 0). */
export function llmBudgetRemainingPercent(status: LlmMonthlyDollarBudgetStatus): number | null {
  const utilizationPercent = llmBudgetUtilizationPercent(status);

  if (utilizationPercent === null) {
    return null;
  }

  const remainingPercent = 100 - utilizationPercent;

  return Math.max(0, Math.round(remainingPercent * 10) / 10);
}

export function shouldShowBuyerLlmUsageBandHint(status: LlmMonthlyDollarBudgetStatus): boolean {
  if (!status.monthlyBudgetMonitoringActive) {
    return false;
  }

  if (status.blocksAdditionalLlmExecution) {
    return true;
  }

  const tone = resolveLlmBudgetUtilizationTone(status);
  const remainingPercent = llmBudgetRemainingPercent(status);

  return (tone === "warn" || tone === "critical") && remainingPercent !== null;
}

export function formatBuyerLlmUsageApproachingCopy(remainingPercent: number): string {
  return `AI analysis budget for this trial month is approximately ${remainingPercent}% remaining. Contact support or upgrade to continue real-mode runs.`;
}

export function formatBuyerLlmUsageExhaustedCopy(): string {
  return "AI analysis budget for this trial month is exhausted (0% remaining). Upgrade to continue real-mode runs.";
}

export function formatTrialAiBudgetRemainingCopy(remainingUsd: number): string {
  const rounded = Math.max(0, Math.round(remainingUsd * 100) / 100);
  return `AI budget remaining: $${rounded.toFixed(2)}`;
}

export function formatTrialAiCreditWarningCopy(): string {
  return "This action may use trial AI credits.";
}
