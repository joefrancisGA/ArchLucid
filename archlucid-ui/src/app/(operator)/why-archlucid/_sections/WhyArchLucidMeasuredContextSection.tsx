import type { WhyArchLucidPageState } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";

export type WhyArchLucidMeasuredContextSectionProps = {
  readonly state: WhyArchLucidPageState;
};

export function WhyArchLucidMeasuredContextSection(props: WhyArchLucidMeasuredContextSectionProps) {
  const { state } = props;

  if (state.snapshotError) {
    return null;
  }

  if (!state.measuredDisclaimer && !state.monthlyCostEstimate) {
    return null;
  }

  return (
    <section
      aria-labelledby="why-archlucid-measured-context-heading"
      data-testid="why-archlucid-measured-context"
      className="space-y-3 rounded border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
    >
      <h2
        id="why-archlucid-measured-context-heading"
        className="text-sm font-semibold text-al-text-primary"
      >
        Measured context (cost + disclaimers)
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Same process counters as above, bundled with the tenant&apos;s configured monthly spend band (when available).
        This is planning guidance — not an invoice.
      </p>
      {state.monthlyCostEstimate ? (
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Tier</dt>
            <dd className="font-medium text-neutral-900 dark:text-neutral-100">{state.monthlyCostEstimate.tier}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Monthly band ({state.monthlyCostEstimate.currency})</dt>
            <dd className="font-medium tabular-nums text-neutral-900 dark:text-neutral-100">
              {state.monthlyCostEstimate.estimatedMonthlyUsdLow} — {state.monthlyCostEstimate.estimatedMonthlyUsdHigh}
            </dd>
          </div>
        </dl>
      ) : null}
      {state.measuredDisclaimer ? (
        <p className="text-xs text-neutral-600 dark:text-neutral-400">{state.measuredDisclaimer}</p>
      ) : null}
    </section>
  );
}
