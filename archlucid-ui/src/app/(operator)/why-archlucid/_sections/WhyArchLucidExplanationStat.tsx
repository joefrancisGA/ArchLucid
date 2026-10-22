import { cn } from "@/lib/utils";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type WhyArchLucidExplanationStatProps = {
  readonly label: string;
  readonly value: number | null | undefined;
};

export function WhyArchLucidExplanationStat(props: WhyArchLucidExplanationStatProps) {
  const { label, value } = props;
  const v = typeof value === "number" && Number.isFinite(value) ? value : null;

  return (
    <div className="rounded border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
      <p className={OPERATOR_NAV_GROUP_LABEL}>{label}</p>
      <p className={cn("tabular-nums text-al-text-primary font-semibold", OPERATOR_TYPOGRAPHY.body)}>
        {v === null ? " — " : v}
      </p>
    </div>
  );
}
