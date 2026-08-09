import { cn } from "@/lib/utils";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type WhyArchLucidCounterProps = {
  readonly label: string;
  readonly value: number;
  readonly hint: string;
  readonly valueFormat?: "hours";
};

export function WhyArchLucidCounter(props: WhyArchLucidCounterProps) {
  const { label, value, hint, valueFormat } = props;
  const shown = valueFormat === "hours" && Number.isFinite(value) ? value.toFixed(2) : String(value);

  return (
    <div
      className="rounded border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      role="group"
      aria-label={label}
    >
      <p className={OPERATOR_NAV_GROUP_LABEL}>{label}</p>
      <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.kpiValue)}>{shown}</p>
      <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{hint}</p>
    </div>
  );
}
