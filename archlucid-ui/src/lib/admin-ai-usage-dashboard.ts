import { apiGet } from "@/lib/api";

export const ADMIN_AI_USAGE_DASHBOARD_PATH = "/v1/admin/ai-usage-dashboard";

export type AdminAiUsageDashboard = {
  budgetAmountUsd: number;
  usedAmountUsd: number;
  remainingAmountUsd: number;
  resetPeriod: string;
  hardStopEnabled: boolean;
  trialExpirationUtc: string | null;
  workspaceKind: string;
  customerAiProviderConfigured: boolean;
  usageByFeatureUsd: Record<string, number>;
  recentEvents: AdminAiUsageEventRow[];
  /** Server-provided freshness when present; otherwise set client-side after fetch. */
  asOfUtc?: string | null;
};

export type AdminAiUsageEventRow = {
  occurredUtc: string;
  feature: string;
  providerKind: string;
  estimatedCostUsd: number;
  userId: string | null;
  servedFromDemoCache: boolean;
  budgetBlocked: boolean;
};

export type FetchAdminAiUsageDashboardOptions = {
  readonly signal?: AbortSignal;
};

export async function fetchAdminAiUsageDashboard(
  options?: FetchAdminAiUsageDashboardOptions,
): Promise<AdminAiUsageDashboard> {
  const payload = await apiGet<Record<string, unknown>>(ADMIN_AI_USAGE_DASHBOARD_PATH, {
    signal: options?.signal,
  });

  return {
    budgetAmountUsd: Number(payload.budgetAmountUsd ?? 0),
    usedAmountUsd: Number(payload.usedAmountUsd ?? 0),
    remainingAmountUsd: Number(payload.remainingAmountUsd ?? 0),
    resetPeriod: typeof payload.resetPeriod === "string" ? payload.resetPeriod : "",
    hardStopEnabled: payload.hardStopEnabled === true,
    trialExpirationUtc:
      typeof payload.trialExpirationUtc === "string" ? payload.trialExpirationUtc : null,
    workspaceKind: typeof payload.workspaceKind === "string" ? payload.workspaceKind : "",
    customerAiProviderConfigured: payload.customerAiProviderConfigured === true,
    usageByFeatureUsd:
      payload.usageByFeatureUsd !== null
      && typeof payload.usageByFeatureUsd === "object"
      && !Array.isArray(payload.usageByFeatureUsd)
        ? Object.fromEntries(
            Object.entries(payload.usageByFeatureUsd as Record<string, unknown>).map(([key, value]) => [
              key,
              Number(value),
            ]),
          )
        : {},
    recentEvents: Array.isArray(payload.recentEvents)
      ? payload.recentEvents
          .map(parseAdminAiUsageEventRow)
          .filter((row): row is AdminAiUsageEventRow => row !== null)
      : [],
    asOfUtc: pickAdminAiUsageAsOfUtc(payload),
  };
}

function pickAdminAiUsageAsOfUtc(payload: Record<string, unknown>): string | null {
  for (const key of ["asOfUtc", "asOf", "generatedAtUtc", "generatedAt"] as const) {
    const value = payload[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function parseAdminAiUsageEventRow(entry: unknown): AdminAiUsageEventRow | null {
  if (entry === null || typeof entry !== "object") {
    return null;
  }

  const row = entry as Record<string, unknown>;

  return {
    occurredUtc: typeof row.occurredUtc === "string" ? row.occurredUtc : "",
    feature: typeof row.feature === "string" ? row.feature : "",
    providerKind: typeof row.providerKind === "string" ? row.providerKind : "",
    estimatedCostUsd: Number(row.estimatedCostUsd ?? 0),
    userId: typeof row.userId === "string" ? row.userId : null,
    servedFromDemoCache: row.servedFromDemoCache === true,
    budgetBlocked: row.budgetBlocked === true,
  };
}
