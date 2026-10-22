"use client";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { DEFAULT_LOADED_HOURLY_USD } from "@/lib/roi-assumptions";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly hourlyUsd: number;
  readonly mounted: boolean;
  readonly isDefaultRate: boolean;
  readonly onHourlyUsdChange: (next: number) => void;
};

export function RoiSummaryLoadedHourlyCostField(props: Props) {
  return (
    <section
      aria-labelledby="roi-loaded-hourly-cost-heading"
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-950/40"
      data-testid="roi-loaded-hourly-cost-field"
    >
      <h2 id="roi-loaded-hourly-cost-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Loaded hourly cost
      </h2>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Used to convert estimated hours saved into dollar value. Use an internal fully loaded architect or reviewer cost.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className={cn("sr-only", OPERATOR_TYPOGRAPHY.helper)} htmlFor="roi-summary-hourly-usd">
          Loaded hourly cost in US dollars
        </label>
        <Input
          id="roi-summary-hourly-usd"
          type="number"
          inputMode="decimal"
          min={1}
          step={1}
          className={cn("max-w-[12rem] font-mono", OPERATOR_TYPOGRAPHY.body)}
          value={props.mounted ? props.hourlyUsd : DEFAULT_LOADED_HOURLY_USD}
          disabled={!props.mounted}
          aria-label="Loaded hourly cost in US dollars"
          onChange={(event) => {
            const next = Number(event.target.value);

            if (Number.isFinite(next) && next > 0) {
              props.onHourlyUsdChange(next);
            }
          }}
        />
        {!props.isDefaultRate ? (
          <span className={cn("rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-950 dark:bg-amber-950/40 dark:text-amber-100", OPERATOR_TYPOGRAPHY.badge)}>
            Custom rate saved to your account
          </span>
        ) : null}
      </div>
    </section>
  );
}
