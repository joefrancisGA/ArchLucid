"use client";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  DEFAULT_LOADED_HOURLY_USD,
  ROI_HOURLY_USD_STORAGE_KEY,
  formatHours,
  formatUsd,
  hoursSurfaced,
  readStoredHourlyUsd,
} from "@/lib/roi-assumptions";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { PilotValueReportSeverityJson } from "@/types/pilot-value-report";

export type RoiTelemetryCardProps = {
  window: "rolling30" | "pilotToDate";
  /** Optional ISO range line from pilot-value-report (parent owns window bounds). */
  rangeCaption?: string;
  severity: Pick<PilotValueReportSeverityJson, "critical" | "high" | "medium">;
  precommitBlocks: number;
  precommitBlocksExact: boolean;
  isAdmin: boolean;
};

function roiCardTitles(w: RoiTelemetryCardProps["window"]): { title: string; windowLabel: string } {
  if (w === "rolling30") {
    return { title: "Rolling 30 days", windowLabel: "Rolling 30-day window (UTC)" };
  }

  return { title: "Since pilot start", windowLabel: "Pilot-to-date window (tenant pilot start → report toUtc)" };
}

/**
 * Hours-first ROI tile; Admin sees loaded $/hour (localStorage) and implied USD total.
 */
export function RoiTelemetryCard(props: RoiTelemetryCardProps) {
  const { title, windowLabel } = roiCardTitles(props.window);
  const domSuffix = props.window;

  const hours = hoursSurfaced({
    critical: props.severity.critical,
    high: props.severity.high,
    medium: props.severity.medium,
    precommitBlocks: props.precommitBlocks,
  });
  const [hourlyUsd, setHourlyUsd] = useState<number>(DEFAULT_LOADED_HOURLY_USD);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHourlyUsd(readStoredHourlyUsd());
  }, []);

  function persistHourlyUsd(next: number): void {
    setHourlyUsd(next);

    try {
      window.localStorage.setItem(ROI_HOURLY_USD_STORAGE_KEY, String(next));
    } catch {
      /* private mode */
    }
  }

  const safePrecommitBlocks = Number.isFinite(props.precommitBlocks) ? Math.max(0, props.precommitBlocks) : 0;
  const blockLabel = props.precommitBlocksExact
    ? String(safePrecommitBlocks)
    : `${safePrecommitBlocks} (sampled)`;

  const usdTotal = hours * hourlyUsd;
  /** Whole-dollar formatting hides sub-dollar totals as "$0" — omit the implied line unless rounding is meaningful. */
  const showImpliedDollarTotal = hours > 1e-9 && Number.isFinite(usdTotal) && usdTotal >= 0.5;
  const hourlyIsDefault = Math.abs(hourlyUsd - DEFAULT_LOADED_HOURLY_USD) < 1e-6;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      aria-labelledby={`roi-card-${domSuffix}`}
    >
      <h2
        id={`roi-card-${domSuffix}`}
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {title}
      </h2>
      <p className={cn("m-0 mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{windowLabel}</p>
      {props.rangeCaption ? (
        <p className={cn("m-0 mt-1 font-mono text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{props.rangeCaption}</p>
      ) : null}
      <p className="m-0 mt-3 font-mono text-4xl font-semibold tabular-nums text-al-text-primary">
        {formatHours(hours)}
      </p>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Model: 8×Critical + 3×High + 1×Medium + 2×pre-commit blocks. Blocks in window:{" "}
        <span title={props.precommitBlocksExact ? undefined : "Audit search may be capped; count is a lower bound."}>
          {blockLabel}
        </span>
        .
      </p>
      {props.isAdmin ? (
        <div className={cn("mt-4 space-y-2 rounded-md border border-neutral-100 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950/50", OPERATOR_TYPOGRAPHY.body)}>
          <div className="flex flex-wrap items-center gap-2">
            <label className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} htmlFor={`hourly-usd-${domSuffix}`}>
              Loaded cost / hour (USD)
            </label>
            {!hourlyIsDefault ? (
              <span className={cn("rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-950 dark:bg-amber-950/40 dark:text-amber-100", OPERATOR_TYPOGRAPHY.badge)}>
                local override
              </span>
            ) : null}
          </div>
          <Input
            id={`hourly-usd-${domSuffix}`}
            type="number"
            inputMode="decimal"
            min={1}
            step={1}
            className={cn("max-w-[12rem] font-mono", OPERATOR_TYPOGRAPHY.body)}
            value={mounted ? hourlyUsd : DEFAULT_LOADED_HOURLY_USD}
            disabled={!mounted}
            aria-label="Loaded engineering cost per hour in US dollars"
            onChange={(e) => {
              const n = Number(e.target.value);

              if (Number.isFinite(n) && n > 0) {
                persistHourlyUsd(n);
              }
            }}
          />
          {hours <= 1e-9 ? (
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
              Not enough data yet to estimate a dollar total.
            </p>
          ) : showImpliedDollarTotal ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Implied total: <span className="font-mono font-medium">{formatUsd(usdTotal)}</span> (estimate only; not an
              invoice).
            </p>
          ) : buyerPolishedShell ? (
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
              Not enough surfaced hours yet for a sponsor-facing dollar estimate.
            </p>
          ) : (
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
              Dollar total would round to $0 at your loaded rate — raise $/hour or wait for more surfaced hours.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
