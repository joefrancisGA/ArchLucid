import type { TrialFunnelCohortRow } from "@/lib/trial-funnel-ops";

export function formatUtcLabel(iso: string | null): string {
  if (!iso) {
    return "Not recorded";
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return "Not recorded";
  }

  return parsed.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function formatPercent(value: number | null, denominatorLabel: string): string {
  if (value === null || !Number.isFinite(value)) {
    return `Unavailable — no ${denominatorLabel} in this period`;
  }

  return `${Math.round(value)}%`;
}

export function formatPeriodDelta(current: number, previous: number | null): string | null {
  if (previous === null) {
    return null;
  }

  const delta = current - previous;

  if (delta === 0) {
    return "No change vs previous period";
  }

  if (delta > 0) {
    return `+${delta} vs previous period`;
  }

  return `${delta} vs previous period`;
}

export function medianTimingLabel(hours: number | null, sampleSize: number | null): string {
  if (hours === null || sampleSize === null || sampleSize === 0) {
    return "Not enough completed trials in this period";
  }

  return `Median: ${hours.toFixed(1)} h · Based on ${sampleSize} trial${sampleSize === 1 ? "" : "s"}`;
}

export function exportCohortCsv(rows: TrialFunnelCohortRow[]): void {
  const header = [
    "Organization",
    "Trial started",
    "Current stage",
    "Days in trial",
    "Last activity",
    "First review status",
    "Estimated first-review AI cost USD",
    "Conversion status",
    "Attention",
  ];

  const lines = rows.map((row) =>
    [
      row.organizationName,
      row.trialStartedUtc ?? "",
      row.currentStageLabel,
      row.daysInTrial?.toString() ?? "",
      row.lastMeaningfulActivityUtc ?? "",
      row.firstReviewStatus,
      row.estimatedFirstReviewCostUsd?.toFixed(2) ?? "",
      row.conversionStatus,
      row.attentionLabel ?? "",
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );

  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "trial-funnel-cohort.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
