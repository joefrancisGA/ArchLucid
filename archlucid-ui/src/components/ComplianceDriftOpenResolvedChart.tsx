import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

export type ComplianceDriftOpenResolvedChartProps = {
  points: ComplianceDriftTrendPoint[];
};

function safeCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function formatBucketLabel(isoUtc: string): string {
  const d = new Date(isoUtc);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  return `${month}/${day}`;
}

/** Dual-series bar chart: findings opened (captured) vs resolved (human review) per UTC day bucket. */
export function ComplianceDriftOpenResolvedChart(props: ComplianceDriftOpenResolvedChartProps) {
  const { points } = props;

  if (points.length === 0) {
    return (
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        No compliance drift findings activity for this period.
      </p>
    );
  }

  const normalized = points.map((p) => ({
    bucketUtc: p.bucketUtc,
    openCount: safeCount(p.openFindingsCount),
    resolvedCount: safeCount(p.resolvedFindingsCount),
  }));

  const maxStack = Math.max(...normalized.map((p) => p.openCount + p.resolvedCount), 1);
  const barMaxPx = 120;

  return (
    <div className="space-y-3" data-testid="compliance-drift-open-resolved-chart">
      <OpenResolvedStackedBars
        normalized={normalized}
        maxStack={maxStack}
        barMaxPx={barMaxPx}
      />
      <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-xs text-neutral-600 dark:text-neutral-400">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500/90" aria-hidden />
          Opened (findings captured)
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal-700/90 dark:bg-teal-500/90" aria-hidden />
          Resolved (human review)
        </li>
      </ul>
    </div>
  );
}

type NormalizedPoint = {
  bucketUtc: string;
  openCount: number;
  resolvedCount: number;
};

function OpenResolvedStackedBars(props: {
  normalized: NormalizedPoint[];
  maxStack: number;
  barMaxPx: number;
}) {
  const { normalized, maxStack, barMaxPx } = props;

  return (
    <div
      className="flex gap-1 border-b border-neutral-200 pb-1 dark:border-neutral-700"
      role="img"
      aria-label="Compliance drift findings trend: stacked bars show opened vs resolved counts per day"
    >
      {normalized.map((point) => {
        const stack = point.openCount + point.resolvedCount;
        const stackPx = stack === 0 ? 0 : Math.max(2, (stack / maxStack) * barMaxPx);
        const openPx = stack === 0 ? 0 : (point.openCount / stack) * stackPx;
        const resolvedPx = stackPx - openPx;
        const title = `Opened ${point.openCount}, resolved ${point.resolvedCount}`;

        return (
          <div
            key={point.bucketUtc}
            className="flex min-h-[144px] min-w-0 flex-1 flex-col items-center justify-end gap-1"
          >
            <div
              className="flex w-full max-w-[2rem] flex-col justify-end overflow-hidden rounded-t"
              style={{ height: stackPx }}
              title={title}
            >
              {resolvedPx > 0 ? (
                <div className="w-full bg-teal-700/90 dark:bg-teal-500/90" style={{ height: resolvedPx }} />
              ) : null}
              {openPx > 0 ? (
                <div className="w-full bg-amber-500/90" style={{ height: openPx }} />
              ) : null}
            </div>
            <span className="truncate text-[10px] text-neutral-500 dark:text-neutral-400">
              {formatBucketLabel(point.bucketUtc)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
