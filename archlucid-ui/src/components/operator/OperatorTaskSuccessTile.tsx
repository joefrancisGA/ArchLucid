"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY, OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";

import { useOperatorTaskSuccessRatesQuery } from "@/hooks/use-operator-task-success-rates-query";
import type { OperatorTaskSuccessRates } from "@/lib/fetch-operator-task-success-rates";
import { presentOperatorSessionsToFinalizedPercent } from "@/lib/operator/operator-sessions-to-finalized-percent-display";

function safeNonNegativeWholeDisplay(value: unknown): string {
  const numeric = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numeric) || numeric < 0) {
    return " — ";
  }

  return String(Math.floor(numeric));
}

/** Small operator-home tile for pilot adoption counters (process lifetime; resets on API restart). */
export function OperatorTaskSuccessTile() {
  const { data, isPending, isError } = useOperatorTaskSuccessRatesQuery();

  if (isError) {
    return (
      <section
        aria-labelledby="operator-task-success-heading"
        className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50"
      >
        <h2 id="operator-task-success-heading" className={cn("font-semibold text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Pilot adoption
        </h2>
        <p className={cn("mt-1.5 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          Adoption counters could not be loaded. Metrics appear after your first completed review session when the API
          responds successfully.
        </p>
      </section>
    );
  }

  if (isPending || data === undefined) {
    return (
      <section
        aria-labelledby="operator-task-success-heading"
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <h2 id="operator-task-success-heading" className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Pilot adoption
        </h2>
        <p className={cn("mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Loading…</p>
      </section>
    );
  }

  return <OperatorTaskSuccessTileBody data={data} />;
}

function OperatorTaskSuccessTileBody(props: { readonly data: OperatorTaskSuccessRates }) {
  const { data } = props;
  const conversion = presentOperatorSessionsToFinalizedPercent(
    data.firstRunCommittedPerSessionRatio,
    data.firstSessionCompletedTotal,
  );

  return (
    <section
      aria-labelledby="operator-task-success-heading"
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h2 id="operator-task-success-heading" className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Pilot adoption
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <dd className="m-0 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {safeNonNegativeWholeDisplay(data.firstSessionCompletedTotal)}
          </dd>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>Sessions</dt>
        </div>
        <div>
          <dd className="m-0 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {safeNonNegativeWholeDisplay(data.firstRunCommittedTotal)}
          </dd>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>Finalized</dt>
        </div>
        <div>
          <dd className="m-0 text-2xl font-bold text-neutral-900 dark:text-neutral-100">{conversion.display}</dd>
          <dt className={cn("uppercase text-neutral-500 dark:text-neutral-400", OPERATOR_NAV_GROUP_LABEL)}>Conversion</dt>
          {conversion.footnote ? (
            <dd className={cn("m-0 mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}>
              {conversion.footnote}
            </dd>
          ) : null}
        </div>
      </dl>
      <p className={cn("mt-2 text-center text-neutral-400 dark:text-neutral-500", OPERATOR_TYPOGRAPHY.badge)}>{data.windowNote}</p>
    </section>
  );
}
