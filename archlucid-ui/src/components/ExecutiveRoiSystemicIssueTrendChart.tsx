import type { ExecutiveRoiSystemicIssueTrendSeries } from "@/lib/executive-summary-markdown";

export type ExecutiveRoiSystemicIssueTrendChartProps = {
  series: ExecutiveRoiSystemicIssueTrendSeries[];
};

const SERIES_COLORS = [
  "bg-sky-600/90 dark:bg-sky-500/90",
  "bg-violet-600/90 dark:bg-violet-500/90",
  "bg-amber-500/90",
  "bg-teal-700/90 dark:bg-teal-500/90",
  "bg-rose-600/90 dark:bg-rose-500/90",
] as const;

function safeCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function formatMonthKey(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());

  if (match == null) {
    return monthKey;
  }

  return `${match[2]}/${match[1].slice(2)}`;
}

/** Stacked bar chart for top systemic issue counts over the trailing six months. */
export function ExecutiveRoiSystemicIssueTrendChart(props: ExecutiveRoiSystemicIssueTrendChartProps) {
  const { series } = props;

  if (series.length === 0) {
    return (
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        No historical systemic issue trends yet — commit architecture reviews to populate this chart.
      </p>
    );
  }

  const monthKeys = series[0]?.points.map((point) => point.monthKey) ?? [];
  const normalized = series.map((entry, index) => ({
    key: `${entry.category}-${entry.severity}-${entry.findingId}`,
    label: `${entry.category} · ${entry.severity}`,
    colorClass: SERIES_COLORS[index % SERIES_COLORS.length],
    countsByMonth: new Map(entry.points.map((point) => [point.monthKey, safeCount(point.count)])),
  }));

  const totalsByMonth = monthKeys.map((monthKey) =>
    normalized.reduce((sum, entry) => sum + (entry.countsByMonth.get(monthKey) ?? 0), 0),
  );
  const maxStack = Math.max(...totalsByMonth, 1);
  const barMaxPx = 120;

  return (
    <div className="space-y-3" data-testid="exec-roi-systemic-issue-trend-chart">
      <div
        className="flex gap-1 border-b border-neutral-200 pb-1 dark:border-neutral-700"
        role="img"
        aria-label="Systemic issue counts by month — stacked bars show top recurring themes"
      >
        {monthKeys.map((monthKey, monthIndex) => {
          const stack = totalsByMonth[monthIndex] ?? 0;
          const stackPx = stack === 0 ? 0 : Math.max(2, (stack / maxStack) * barMaxPx);

          return (
            <div
              key={monthKey}
              className="flex min-h-[144px] min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <div
                className="flex w-full max-w-[2rem] flex-col justify-end overflow-hidden rounded-t"
                style={{ height: stackPx }}
                title={`${stack} findings across top themes`}
              >
                {normalized.map((entry) => {
                  const count = entry.countsByMonth.get(monthKey) ?? 0;

                  if (count === 0 || stack === 0) {
                    return null;
                  }

                  const segmentPx = (count / stack) * stackPx;

                  return (
                    <div
                      key={entry.key}
                      className={`w-full ${entry.colorClass}`}
                      style={{ height: segmentPx }}
                      title={`${entry.label}: ${count}`}
                    />
                  );
                })}
              </div>
              <span className="truncate text-[10px] text-neutral-500 dark:text-neutral-400">
                {formatMonthKey(monthKey)}
              </span>
            </div>
          );
        })}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-xs text-neutral-600 dark:text-neutral-400">
        {normalized.map((entry) => (
          <li key={entry.key} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${entry.colorClass}`} aria-hidden />
            {entry.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
