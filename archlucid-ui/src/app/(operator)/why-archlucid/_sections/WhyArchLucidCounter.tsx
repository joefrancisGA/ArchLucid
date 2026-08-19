import { cn } from "@/lib/utils";
import {
  OPERATOR_KPI_CARD_DESCRIPTION,
  OPERATOR_KPI_CARD_TITLE,
  OPERATOR_KPI_VALUE,
} from "@/lib/design-tokens";

export type WhyArchLucidCounterProps = {
  readonly label: string;
  readonly value: number;
  readonly hint: string;
  readonly valueFormat?: "hours";
};

export function WhyArchLucidCounter(props: WhyArchLucidCounterProps) {
  const { label, value, hint, valueFormat } = props;
  const shown = valueFormat === "hours" && Number.isFinite(value) ? value.toFixed(2) : String(value);
  const isHoursZero = valueFormat === "hours" && Number.isFinite(value) && value === 0;

  return (
    <div
      className="rounded border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      role="group"
      aria-label={label}
    >
      <p className={OPERATOR_KPI_CARD_TITLE}>{label}</p>
      <p className={cn("mt-1", isHoursZero ? OPERATOR_KPI_CARD_DESCRIPTION : OPERATOR_KPI_VALUE)}>{shown}</p>
      <p className={cn("mt-1 text-al-text-secondary", OPERATOR_KPI_CARD_DESCRIPTION)}>{hint}</p>
    </div>
  );
}
