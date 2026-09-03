export type AiUsageSectionLoadState =
  | "loading"
  | "ready"
  | "empty"
  | "error"
  | "delayed"
  | "permission_restricted"
  | "inactive";

export type AiUsageBudgetPaceStatus = "on_track" | "approaching_limit" | "at_risk" | "exhausted" | "inactive";

export type AiUsageActivityBadge = "Manual" | "Scheduled" | "Retry" | "Evidence check" | "Skipped";

export type AiUsageActivityStatus =
  | "Completed"
  | "Running"
  | "Failed"
  | "Skipped"
  | "Budget blocked"
  | "Cancelled";

export type AiUsageDailyMetric = "cost" | "tokens" | "operations" | "requests";

export type AiUsageKpiSummary = {
  readonly usedThisMonthUsd: number | null;
  readonly remainingBudgetUsd: number | null;
  readonly budgetTotalUsd: number | null;
  readonly budgetPercentUsed: number | null;
  readonly projectedMonthEndUsd: number | null;
  readonly projectedIsApproximate: boolean;
  readonly daysRemainingInBillingPeriod: number | null;
  readonly changeVsPrior30DaysPercent: number | null;
  readonly changeVsPrior30DaysIsApproximate: boolean;
  readonly highestCostProjectName: string | null;
  readonly highestCostOperationName: string | null;
  readonly currency: string;
};

export type AiUsageBreakdownRow = {
  readonly key: string;
  readonly name: string;
  readonly usageCount: number;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly estimatedCostUsd: number;
  readonly percentOfTotal: number;
  readonly trendPercent: number | null;
  readonly detailHref: string | null;
};

export type AiUsageActivityRow = {
  readonly key: string;
  readonly occurredUtc: string;
  readonly subjectLabel: string;
  readonly operationLabel: string;
  readonly modelLabel: string;
  readonly initiatedByLabel: string;
  readonly triggerBadge: AiUsageActivityBadge;
  readonly promptTokens: number | null;
  readonly completionTokens: number | null;
  readonly estimatedCostUsd: number;
  readonly actualCostUsd: number | null;
  readonly status: AiUsageActivityStatus;
  readonly budgetUsedLabel: string;
  readonly detailHref: string | null;
  readonly feature: string;
  readonly userId: string | null;
  readonly providerKind: string;
};
