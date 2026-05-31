export type WhyArchLucidExplanationStatProps = {
  readonly label: string;
  readonly value: number | null | undefined;
};

export function WhyArchLucidExplanationStat(props: WhyArchLucidExplanationStatProps) {
  const { label, value } = props;
  const v = typeof value === "number" && Number.isFinite(value) ? value : null;

  return (
    <div className="rounded border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-al-text-primary">
        {v === null ? "—" : v}
      </p>
    </div>
  );
}
