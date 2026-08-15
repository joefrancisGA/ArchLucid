import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  title: string;
  value: string;
  hint?: string;
};

/** Shared KPI tile for sponsor-report surfaces (Sponsor report, ROI summary hero strip). */
export function SponsorReportMetricCard(props: Props) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <p className={cn(OPERATOR_TYPOGRAPHY.tab, "uppercase tracking-wide text-al-text-secondary")}>{props.title}</p>
      <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.kpiValue)}>
        {props.value}
      </p>
      {props.hint ? (
        <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{props.hint}</p>
      ) : null}
    </div>
  );
}
