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
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{shown}</p>
      <p className="mt-1 text-xs text-neutral-500">
        <code>{hint}</code>
      </p>
    </div>
  );
}
