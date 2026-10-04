import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";
import {
  formatComplianceDriftActivityCountDisplay,
  parseComplianceDriftActivityCount,
} from "@/lib/compliance-drift-open-resolved-count";

export type ComplianceDriftOpenResolvedChartProps = {
  points: ComplianceDriftTrendPoint[];
};

function formatBucketLabel(isoUtc: string): string {
  const d = new Date(isoUtc);

  if (Number.isNaN(d.getTime())) {
    return "Date not readable";
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
      <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        No compliance drift findings activity for this period.
      </p>
    );
  }

  const normalized = points.map((p) => ({
    bucketUtc: p.bucketUtc,
    openCount: parseComplianceDriftActivityCount(p.openFindingsCount),
    resolvedCount: parseComplianceDriftActivityCount(p.resolvedFindingsCount),
  }));

  const maxStack = Math.max(
    ...normalized.map((p) => (p.openCount ?? 0) + (p.resolvedCount ?? 0)),
    1,
  );
  const barMaxPx = 120;

  return (
    <div className="space-y-3" data-testid="compliance-drift-open-resolved-chart">
      <OpenResolvedStackedBars
        normalized={normalized}
        maxStack={maxStack}
        barMaxPx={barMaxPx}
      />
      <ul className={cn("m-0 flex list-none flex-wrap gap-4 p-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
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
  openCount: number | null;
  resolvedCount: number | null;
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
        const open = point.openCount ?? 0;
        const resolved = point.resolvedCount ?? 0;
        const stack = open + resolved;
        const stackPx = stack === 0 ? 0 : Math.max(2, (stack / maxStack) * barMaxPx);
        const openPx = stack === 0 ? 0 : (open / stack) * stackPx;
        const resolvedPx = stackPx - openPx;
        const barAriaLabel = `Opened ${formatComplianceDriftActivityCountDisplay(point.openCount)}, resolved ${formatComplianceDriftActivityCountDisplay(point.resolvedCount)}`;

        return (
          <div
            key={point.bucketUtc}
            className="flex min-h-[144px] min-w-0 flex-1 flex-col items-center justify-end gap-1"
          >
            <div
              className="flex w-full max-w-[2rem] flex-col justify-end overflow-hidden rounded-t"
              style={{ height: stackPx }}
              tabIndex={0}
              aria-label={barAriaLabel}
            >
              {resolvedPx > 0 ? (
                <div className="w-full bg-teal-700/90 dark:bg-teal-500/90" style={{ height: resolvedPx }} />
              ) : null}
              {openPx > 0 ? (
                <div className="w-full bg-amber-500/90" style={{ height: openPx }} />
              ) : null}
            </div>
            <span className={cn("truncate text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}>
              {formatBucketLabel(point.bucketUtc)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
