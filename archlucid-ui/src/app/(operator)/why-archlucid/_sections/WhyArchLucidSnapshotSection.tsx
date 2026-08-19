import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import type { WhyArchLucidPageState } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { WhyArchLucidCounterGrid } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidCounterGrid";
import { WHY_ARCHLUCID_SECTION_SHELL_CLASS } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-section-shell";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WHY_ARCHLUCID_COUNTERS_INTRO,
  WHY_ARCHLUCID_MEASURED_CONTEXT_INTRO,
  WHY_ARCHLUCID_MEASURED_CONTEXT_TITLE,
} from "@/lib/why-archlucid-page-copy";

export type WhyArchLucidSnapshotSectionProps = {
  readonly state: WhyArchLucidPageState;
};

export function WhyArchLucidSnapshotSection(props: WhyArchLucidSnapshotSectionProps) {
  const { state } = props;
  const showMeasuredContext = !state.snapshotError && (state.measuredDisclaimer !== null || state.monthlyCostEstimate !== null);

  return (
    <section
      aria-labelledby="why-archlucid-counters-heading"
      data-testid="why-archlucid-counters"
      className={WHY_ARCHLUCID_SECTION_SHELL_CLASS}
    >
      <h2 id="why-archlucid-counters-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Process counters
      </h2>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {WHY_ARCHLUCID_COUNTERS_INTRO}
      </p>

      {state.snapshotError ? (
        <OperatorApiProblem
          problem={state.snapshotError.problem}
          fallbackMessage={state.snapshotError.message}
          correlationId={state.snapshotError.correlationId}
        />
      ) : null}

      {state.snapshot ? <WhyArchLucidCounterGrid snapshot={state.snapshot} /> : null}

      {showMeasuredContext ? (
        <div
          className="space-y-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
          data-testid="why-archlucid-measured-context"
        >
          <h3 id="why-archlucid-measured-context-heading" className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {WHY_ARCHLUCID_MEASURED_CONTEXT_TITLE}
          </h3>
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{WHY_ARCHLUCID_MEASURED_CONTEXT_INTRO}</p>
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
        </div>
      ) : null}
    </section>
  );
}
