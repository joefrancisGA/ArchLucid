import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { presentComplianceDriftChangeCount } from "@/lib/compliance-drift-change-count-display";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

export interface ComplianceDriftChartProps {
  points: readonly ComplianceDriftTrendPoint[];
}

function safeNonNegativeCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.floor(value));
}

function hasInvalidTypedChangeCounts(raw: Record<string, number>): boolean {
  return Object.values(raw).some((value) => safeNonNegativeCount(value) === null);
}

function sanitizedChangesByType(raw: Record<string, number>): Record<string, number> {
  const next: Record<string, number> = {};

  for (const [key, value] of Object.entries(raw)) {
    const n = safeNonNegativeCount(value);

    if (n !== null && n > 0) {
      next[key] = n;
    }
  }

  return next;
}

function formatBucketLabel(isoUtc: string): string {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) {
    return "Date not readable";
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
      <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        No compliance drift data for this period.
      </p>
    );
  }

  const normalized = points.map((p) => {
    const change = presentComplianceDriftChangeCount(p.changeCount);

    return {
      bucketUtc: p.bucketUtc,
      changeCountKnown: change.known,
      changeCountLabel: change.display,
      changeCount: change.numeric,
      changesByType: sanitizedChangesByType(p.changesByType ?? {}),
      typedCountsIncomplete: hasInvalidTypedChangeCounts(p.changesByType ?? {}),
    };
  });

  const knownCounts = normalized.filter((p) => p.changeCountKnown).map((p) => p.changeCount);
  const maxCount = Math.max(...knownCounts, 1);
  const barMaxPx = 120;

  return (
    <div
      className="flex gap-1 border-b border-neutral-200 pb-1 dark:border-neutral-700"
      role="img"
      aria-label="Compliance drift trend: bar height shows policy pack change count per time bucket"
    >
      {normalized.map((point) => {
        const barPx =
          !point.changeCountKnown || point.changeCount === 0
            ? 0
            : Math.max(2, (point.changeCount / maxCount) * barMaxPx);

        const typedSuffix = point.typedCountsIncomplete
          ? "typed change counts not returned"
          : topChangeTypesSummary(point.changesByType);
        const title = point.changeCountKnown
          ? `${point.changeCount} changes — ${typedSuffix}`
          : `Change count not returned — ${typedSuffix}`;

        return (
          <div
            key={point.bucketUtc}
            className="flex min-w-0 min-h-[144px] flex-1 flex-col items-center justify-end gap-1"
          >
            <div
              className="w-full max-w-[2rem] rounded-t bg-violet-600/90 dark:bg-violet-500/90"
              style={{ height: barPx }}
              aria-label={title}
            />
            <span className={cn("truncate text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}>
              {formatBucketLabel(point.bucketUtc)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
