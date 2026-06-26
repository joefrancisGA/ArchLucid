"use client";

import { useMemo } from "react";

import type { PilotValueReportSeverityJson } from "@/types/pilot-value-report";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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

  const max = Math.max(1, ...rows.map((r) => r.n));

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className={cn("grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <span className="text-al-text-secondary">{r.label}</span>
          <div className="h-3 rounded bg-neutral-100 dark:bg-neutral-800">
            <div
              className={`h-3 rounded ${r.barClass}`}
              style={{ width: `${Math.min(100, (r.n / max) * 100)}%` }}
              title={`${r.label}: ${r.n}`}
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
