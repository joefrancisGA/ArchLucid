import type { AdminAiUsageEventRow } from "@/lib/admin-ai-usage-dashboard";
import type { AiUsageActivityStatusFilter, AiUsageDashboardFilters } from "@/lib/ai-usage-dashboard-filters";

import type { AiUsageActivityBadge, AiUsageActivityRow, AiUsageActivityStatus } from "./ai-usage-dashboard-model-types";

function isSystemInitiator(userId: string | null): boolean {
  if (userId === null) {
    return true;
  }

  const normalized = userId.trim().toLowerCase();

  return normalized.length === 0 || normalized === "system" || normalized === "scheduler";
}

/** Infers trigger badges until the API exposes explicit run origin. */
export function inferAiUsageActivityBadge(event: AdminAiUsageEventRow): AiUsageActivityBadge {
  if (event.servedFromDemoCache && event.estimatedCostUsd <= 0) {
    return "Skipped";
  }

  if (event.feature === "EvidenceIndexing" || event.feature === "EvidenceQa") {
    return "Evidence check";
  }

  if (isSystemInitiator(event.userId)) {
    return "Scheduled";
  }

  return "Manual";
}

export function inferAiUsageActivityStatus(event: AdminAiUsageEventRow): AiUsageActivityStatus {
  if (event.budgetBlocked) {
    return "Budget blocked";
  }

  if (event.servedFromDemoCache && event.estimatedCostUsd <= 0) {
    return "Skipped";
  }

  return "Completed";
}

function formatBudgetUsedLabel(event: AdminAiUsageEventRow): string {
  if (event.budgetBlocked) {
    return "AI budget used: blocked before execution";
  }

  if (event.servedFromDemoCache && event.estimatedCostUsd <= 0) {
    return "AI budget used: $0.00";
  }

  return `AI budget used: $${event.estimatedCostUsd.toFixed(2)}`;
}

export function formatAiUsageFeatureLabel(feature: string): string {
  switch (feature) {
    case "ArchitectureGeneration":
      return "Architecture generation";
    case "ReviewAnalysis":
      return "Review analysis";
    case "EvidenceQa":
      return "Evidence Q&A";
    case "EvidenceIndexing":
      return "Evidence indexing";
    case "Comparison":
      return "Comparison";
    case "ReportGeneration":
      return "Report generation";
    case "QuickScan":
      return "Quick Scan";
    default:
      return feature.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
}

export function mapAiUsageActivityRow(event: AdminAiUsageEventRow, index: number): AiUsageActivityRow {
  const status = inferAiUsageActivityStatus(event);
  const triggerBadge = inferAiUsageActivityBadge(event);

  return {
    key: `${event.occurredUtc}-${index}`,
    occurredUtc: event.occurredUtc,
    subjectLabel: formatAiUsageFeatureLabel(event.feature),
    operationLabel: formatAiUsageFeatureLabel(event.feature),
    modelLabel: event.providerKind.trim().length > 0 ? event.providerKind : " — ",
    initiatedByLabel: event.userId ?? "System / scheduled",
    triggerBadge,
    promptTokens: null,
    completionTokens: null,
    estimatedCostUsd: event.estimatedCostUsd,
    actualCostUsd: null,
    status,
    budgetUsedLabel: formatBudgetUsedLabel(event),
    detailHref: null,
    feature: event.feature,
    userId: event.userId,
    providerKind: event.providerKind,
  };
}

export function matchesAiUsageActivityFilters(row: AiUsageActivityRow, filters: AiUsageDashboardFilters): boolean {
  if (filters.feature !== null && row.feature !== filters.feature) {
    return false;
  }

  if (filters.userId !== null && (row.userId ?? "") !== filters.userId) {
    return false;
  }

  if (filters.model !== null && row.providerKind !== filters.model) {
    return false;
  }

  if (filters.trigger === "manual" && row.triggerBadge !== "Manual") {
    return false;
  }

  if (filters.trigger === "scheduled" && row.triggerBadge !== "Scheduled") {
    return false;
  }

  if (filters.status !== "all") {
    const normalized = row.status.toLowerCase().replace(/\s+/g, "_") as AiUsageActivityStatusFilter;

    if (normalized !== filters.status) {
      return false;
    }
  }

  return true;
}

export function buildAiUsageActivityCsv(rows: readonly AiUsageActivityRow[]): string {
  const header = [
    "occurredUtc",
    "operation",
    "model",
    "initiatedBy",
    "trigger",
    "estimatedCostUsd",
    "status",
    "budgetUsed",
  ];

  const lines = rows.map((row) =>
    [
      row.occurredUtc,
      row.operationLabel,
      row.modelLabel,
      row.initiatedByLabel,
      row.triggerBadge,
      row.estimatedCostUsd.toFixed(2),
      row.status,
      row.budgetUsedLabel,
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}
