import { apiGet } from "@/lib/api";

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
};

const CACHE_TTL_MS = 60_000;

let cachedStatus: LlmMonthlyDollarBudgetStatus | null = null;
let cachedAtMs = 0;
let inflight: Promise<LlmMonthlyDollarBudgetStatus> | null = null;

/** Client-side cache so settings and run wizards share one lightweight status read per minute. */
export async function fetchLlmMonthlyDollarBudgetStatusCached(
  options?: { force?: boolean },
): Promise<LlmMonthlyDollarBudgetStatus> {
  const force = options?.force === true;
  const now = Date.now();

  if (!force && cachedStatus !== null && now - cachedAtMs < CACHE_TTL_MS) {
    return cachedStatus;
  }

  if (!force && inflight !== null) {
    return inflight;
  }

  inflight = apiGet<LlmMonthlyDollarBudgetStatus>(LLM_MONTHLY_DOLLAR_BUDGET_STATUS_PATH)
    .then((data) => {
      cachedStatus = data;
      cachedAtMs = Date.now();

      return data;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
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
