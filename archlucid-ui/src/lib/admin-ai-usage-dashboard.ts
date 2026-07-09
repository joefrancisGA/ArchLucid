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

export async function fetchAdminAiUsageDashboard(): Promise<AdminAiUsageDashboard> {
  return apiGet<AdminAiUsageDashboard>(ADMIN_AI_USAGE_DASHBOARD_PATH);
}
