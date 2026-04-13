import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

export interface ComplianceDriftChartProps {
  points: ComplianceDriftTrendPoint[];
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

function topChangeTypesSummary(changesByType: Record<string, number>): string {
  const entries = Object.entries(changesByType).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 3).map(([k, v]) => `${k}: ${v}`);

  return top.length > 0 ? top.join(", ") : "no typed changes";
}

export function ComplianceDriftChart({ points }: ComplianceDriftChartProps) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        No compliance drift data for this period.
      </p>
    );
  }

  const maxCount = Math.max(...points.map((p) => p.changeCount), 1);
  const barMaxPx = 120;

  return (
    <div
      className="flex gap-1 border-b border-neutral-200 pb-1 dark:border-neutral-700"
      role="img"
      aria-label="Compliance drift trend: bar height shows policy pack change count per time bucket"
    >
      {points.map((point) => {
        const barPx =
          point.changeCount === 0 ? 0 : Math.max(2, (point.changeCount / maxCount) * barMaxPx);

        const title = `${point.changeCount} changes — ${topChangeTypesSummary(point.changesByType)}`;

        return (
          <div
            key={point.bucketUtc}
            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
            style={{ minHeight: barMaxPx + 24 }}
          >
            <div
              className="w-full max-w-[2rem] rounded-t bg-violet-600/90 dark:bg-violet-500/90"
              style={{ height: barPx }}
              title={title}
            />
            <span className="truncate text-[10px] text-neutral-500 dark:text-neutral-400">
              {formatBucketLabel(point.bucketUtc)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
