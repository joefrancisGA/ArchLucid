import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ScorecardMetricCardProps = {
  detail?: string;
  title: string;
  value: string;
};

export function ScorecardMetricCard({ detail, title, value }: ScorecardMetricCardProps) {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      data-testid={`scorecard-metric-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <p className={cn(OPERATOR_TYPOGRAPHY.tab, "uppercase tracking-wide text-al-text-secondary")}>{title}</p>
      <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>{value}</p>

      {detail ? (
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{detail}</p>
      ) : null}
    </div>
  );
}

type ScorecardSummaryTileProps = {
  detail: string;
  label: string;
  value: string;
};

export function ScorecardSummaryTile({ detail, label, value }: ScorecardSummaryTileProps) {
  return (
    <div
      className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-3 shadow-sm dark:border-neutral-800"
      data-testid={`scorecard-summary-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{label}</p>
      <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.kpiValue)}>{value}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{detail}</p>
    </div>
  );
}
