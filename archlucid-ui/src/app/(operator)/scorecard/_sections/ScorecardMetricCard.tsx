type ScorecardMetricCardProps = {
  hint?: string;
  provenance?: string;
  title: string;
  value: string;
};

export function ScorecardMetricCard({ hint, provenance, title, value }: ScorecardMetricCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-neutral-900 tabular-nums dark:text-neutral-100">
        {value}
      </p>

      {hint ? (
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>
      ) : null}

      {provenance ? (
        <p className="mt-1 text-[10px] uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Source: {provenance}
        </p>
      ) : null}
    </div>
  );
}
