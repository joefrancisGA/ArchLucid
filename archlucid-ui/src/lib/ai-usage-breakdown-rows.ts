import type { AdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import type { AiUsageBreakdownGroupBy } from "@/lib/ai-usage-dashboard-filters";
import type { LlmCostReportingDashboard } from "@/lib/llm-cost-reporting";

import { formatAiUsageFeatureLabel } from "./ai-usage-dashboard-model-activity";
import type { AiUsageBreakdownRow } from "./ai-usage-dashboard-model-types";

export function buildBreakdownRows(
  groupBy: AiUsageBreakdownGroupBy,
  costReporting: LlmCostReportingDashboard | null,
  adminDashboard: AdminAiUsageDashboard | null,
): AiUsageBreakdownRow[] {
  if (costReporting === null && adminDashboard === null) {
    return [];
  }

  const rows: AiUsageBreakdownRow[] = [];

  if (groupBy === "workspace" || groupBy === "project") {
    const source = costReporting?.byWorkspaceProject ?? [];

    for (const row of source) {
      const name = groupBy === "workspace" ? row.workspaceName : row.projectName;
      const key = groupBy === "workspace" ? row.workspaceId : `${row.workspaceId}:${row.projectId}`;

      rows.push({
        key,
        name,
        usageCount: 1,
        promptTokens: row.promptTokens,
        completionTokens: row.completionTokens,
        estimatedCostUsd: row.estimatedCostUsd,
        percentOfTotal: 0,
        trendPercent: null,
        detailHref: null,
      });
    }
  }

  if (groupBy === "operation" && adminDashboard !== null) {
    for (const [feature, usd] of Object.entries(adminDashboard.usageByFeatureUsd)) {
      rows.push({
        key: feature,
        name: formatAiUsageFeatureLabel(feature),
        usageCount: 1,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: usd,
        percentOfTotal: 0,
        trendPercent: null,
        detailHref: null,
      });
    }
  }

  if (groupBy === "model" && adminDashboard !== null) {
    const grouped = new Map<string, { cost: number; count: number }>();

    for (const event of adminDashboard.recentEvents) {
      const model = event.providerKind.trim().length > 0 ? event.providerKind : "Unknown model";
      const existing = grouped.get(model) ?? { cost: 0, count: 0 };

      grouped.set(model, {
        cost: existing.cost + event.estimatedCostUsd,
        count: existing.count + 1,
      });
    }

    for (const [model, stats] of grouped.entries()) {
      rows.push({
        key: model,
        name: model,
        usageCount: stats.count,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: stats.cost,
        percentOfTotal: 0,
        trendPercent: null,
        detailHref: null,
      });
    }
  }

  if (groupBy === "user" && adminDashboard !== null) {
    const grouped = new Map<string, { cost: number; count: number }>();

    for (const event of adminDashboard.recentEvents) {
      const user = event.userId ?? "System / scheduled";
      const existing = grouped.get(user) ?? { cost: 0, count: 0 };

      grouped.set(user, {
        cost: existing.cost + event.estimatedCostUsd,
        count: existing.count + 1,
      });
    }

    for (const [user, stats] of grouped.entries()) {
      rows.push({
        key: user,
        name: user,
        usageCount: stats.count,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: stats.cost,
        percentOfTotal: 0,
        trendPercent: null,
        detailHref: null,
      });
    }
  }

  if (groupBy === "run" && costReporting !== null) {
    for (const run of costReporting.topRuns) {
      rows.push({
        key: run.runId,
        name: `Run ${run.runId.slice(0, 8)}…`,
        usageCount: run.llmCallCount,
        promptTokens: run.promptTokens,
        completionTokens: run.completionTokens,
        estimatedCostUsd: run.estimatedCostUsd,
        percentOfTotal: 0,
        trendPercent: null,
        detailHref: `/architecture/reviews/${encodeURIComponent(run.runId)}`,
      });
    }
  }

  const totalCost = rows.reduce((sum, row) => sum + row.estimatedCostUsd, 0);

  return rows
    .map((row) => ({
      ...row,
      percentOfTotal: totalCost > 0 ? Math.round((row.estimatedCostUsd / totalCost) * 1000) / 10 : 0,
    }))
    .sort((left, right) => right.estimatedCostUsd - left.estimatedCostUsd);
}
