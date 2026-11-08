"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

import type { PilotValueReportSeverityJson } from "@/types/pilot-value-report";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { pilotValueReportSeverityBandCount } from "@/lib/sponsor/pilot-value-report-count-display";

type Props = {
  readonly counts: PilotValueReportSeverityJson;
};

const NOT_STORED_LABEL = "Severity count was not stored.";

export function PilotValueReportSeverityBars(props: Props) {
  const rows = useMemo(
    () =>
      [
        { label: "Critical", n: pilotValueReportSeverityBandCount(props.counts.critical), barClass: "bg-red-600" },
        { label: "High", n: pilotValueReportSeverityBandCount(props.counts.high), barClass: "bg-orange-800" },
        { label: "Medium", n: pilotValueReportSeverityBandCount(props.counts.medium), barClass: "bg-amber-500" },
        { label: "Low", n: pilotValueReportSeverityBandCount(props.counts.low), barClass: "bg-blue-500" },
        { label: "Info", n: pilotValueReportSeverityBandCount(props.counts.info), barClass: "bg-neutral-400 dark:bg-neutral-600" },
      ] as const,
    [props.counts],
  );

  const anyMissing = rows.some((row) => row.n === null);
  const total = rows.reduce((sum, row) => (row.n === null ? sum : sum + row.n), 0);

  if (!anyMissing && total === 0) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="severity-empty-state">
        No findings were recorded for finalized reviews in this reporting period.
      </p>
    );
  }

  const max = Math.max(1, ...rows.map((r) => r.n ?? 0));

  return (
    <div className="space-y-3" data-testid="severity-distribution">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Total findings:{" "}
        <span className="font-medium text-al-text-primary">
          {anyMissing ? NOT_STORED_LABEL : total}
        </span>
      </p>
      {rows.map((r) => {
        const display = r.n === null ? NOT_STORED_LABEL : String(r.n);
        const barWidth = r.n === null ? 0 : Math.min(100, (r.n / max) * 100);

        return (
          <div
            key={r.label}
            className={cn("grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2", OPERATOR_TYPOGRAPHY.body)}
          >
            <span className="text-al-text-secondary">
              {r.label} ({display})
            </span>
            <div
              className="h-3 rounded bg-neutral-100 dark:bg-neutral-800"
              role="img"
              aria-label={`${r.label}: ${display}`}
            >
              <div className={`h-3 rounded ${r.barClass}`} style={{ width: `${barWidth}%` }} />
            </div>
            <span className={cn("text-right font-mono tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.dataValue)}>
              {display}
            </span>
          </div>
        );
      })}
    </div>
  );
}
