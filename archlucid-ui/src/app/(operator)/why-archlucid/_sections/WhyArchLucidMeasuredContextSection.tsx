import { cn } from "@/lib/utils";
import type { WhyArchLucidPageState } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
      <h2 id="why-archlucid-measured-context-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Measured context (cost + disclaimers)
      </h2>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Same process counters as above, bundled with the tenant&apos;s configured monthly spend band (when available).
        This is planning guidance — not an invoice.
      </p>
      {state.monthlyCostEstimate ? (
        <dl className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Tier</dt>
            <dd className="font-medium text-al-text-primary">{state.monthlyCostEstimate.tier}</dd>
          </div>
          <div>
            <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Monthly band ({state.monthlyCostEstimate.currency})
            </dt>
            <dd className="font-medium tabular-nums text-al-text-primary">
              {state.monthlyCostEstimate.estimatedMonthlyUsdLow} — {state.monthlyCostEstimate.estimatedMonthlyUsdHigh}
            </dd>
          </div>
        </dl>
      ) : null}
      {state.measuredDisclaimer ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{state.measuredDisclaimer}</p>
      ) : null}
    </section>
  );
}
