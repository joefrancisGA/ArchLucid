import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type ScorecardMetricCardProps = {
  hint?: string;
  provenance?: string;
  title: string;
  value: string;
};

export function ScorecardMetricCard({ hint, provenance, title, value }: ScorecardMetricCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <p className={cn(OPERATOR_TYPOGRAPHY.tab, "uppercase tracking-wide text-al-text-secondary")}>{title}</p>
      <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
        {value}
      </p>

      {hint ? (
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{hint}</p>
      ) : null}

      {provenance ? (
        <p className={cn("mt-1 uppercase tracking-wide", OPERATOR_TYPOGRAPHY.micro, "text-al-text-secondary")}>
          Source: {provenance}
        </p>
      ) : null}
    </div>
  );
}
