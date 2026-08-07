"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

import type { PilotValueReportSeverityJson } from "@/types/pilot-value-report";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly counts: PilotValueReportSeverityJson;
};

export function PilotValueReportSeverityBars(props: Props) {
  const rows = useMemo(
    () =>
      [
        { label: "Critical", n: props.counts.critical, barClass: "bg-red-600" },
        { label: "High", n: props.counts.high, barClass: "bg-orange-800" },
        { label: "Medium", n: props.counts.medium, barClass: "bg-amber-500" },
        { label: "Low", n: props.counts.low, barClass: "bg-blue-500" },
        { label: "Info", n: props.counts.info, barClass: "bg-neutral-400 dark:bg-neutral-600" },
      ] as const,
    [props.counts],
  );

  const total = rows.reduce((sum, row) => sum + row.n, 0);

  if (total === 0) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="severity-empty-state">
        No findings were recorded for finalized reviews in this reporting period.
      </p>
    );
  }

  const max = Math.max(1, ...rows.map((r) => r.n));

  return (
    <div className="space-y-3" data-testid="severity-distribution">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Total findings: <span className="font-medium text-al-text-primary">{total}</span>
      </p>
      {rows.map((r) => (
        <div key={r.label} className={cn("grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <span className="text-al-text-secondary">
            {r.label} ({r.n})
          </span>
          <div
            className="h-3 rounded bg-neutral-100 dark:bg-neutral-800"
            role="img"
            aria-label={`${r.label}: ${r.n} findings`}
          >
            <div
              className={`h-3 rounded ${r.barClass}`}
              style={{ width: `${Math.min(100, (r.n / max) * 100)}%` }}
            />
          </div>
          <span className={cn("text-right font-mono tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.dataValue)}>
            {r.n}
          </span>
        </div>
      ))}
    </div>
  );
}
