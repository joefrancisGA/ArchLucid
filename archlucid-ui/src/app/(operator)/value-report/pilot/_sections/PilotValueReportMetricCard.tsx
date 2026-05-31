type Props = {
  title: string;
  value: string;
  hint?: string;
};

export function PilotValueReportMetricCard(props: Props) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{props.title}</p>
      <p className="mt-2 font-mono text-4xl font-semibold tabular-nums text-al-text-primary">
        {props.value}
      </p>
      {props.hint ? (
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{props.hint}</p>
      ) : null}
    </div>
  );
}
