"use client";

import { useMemo } from "react";

import type { PilotValueReportSeverityJson } from "@/types/pilot-value-report";

type Props = {
  readonly counts: PilotValueReportSeverityJson;
};

export function PilotValueReportSeverityBars(props: Props) {
  const rows = useMemo(
    () =>
      [
        { label: "Critical", n: props.counts.critical, barClass: "bg-red-600" },
        { label: "High", n: props.counts.high, barClass: "bg-orange-600" },
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
        <div key={r.label} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2 text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">{r.label}</span>
          <div className="h-3 rounded bg-neutral-100 dark:bg-neutral-800">
            <div
              className={`h-3 rounded ${r.barClass}`}
              style={{ width: `${Math.min(100, (r.n / max) * 100)}%` }}
              title={`${r.label}: ${r.n}`}
            />
          </div>
          <span className="text-right font-mono tabular-nums text-neutral-800 dark:text-neutral-200">{r.n}</span>
        </div>
      ))}
    </div>
  );
}
