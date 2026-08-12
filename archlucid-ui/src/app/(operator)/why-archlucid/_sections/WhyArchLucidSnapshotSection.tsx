import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import type { WhyArchLucidPageState } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { WhyArchLucidCounterGrid } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidCounterGrid";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { WHY_ARCHLUCID_COUNTERS_INTRO } from "@/lib/why-archlucid-page-copy";

export type WhyArchLucidSnapshotSectionProps = {
  readonly state: WhyArchLucidPageState;
};

export function WhyArchLucidSnapshotSection(props: WhyArchLucidSnapshotSectionProps) {
  const { state } = props;

  return (
    <section
      aria-labelledby="why-archlucid-counters-heading"
      data-testid="why-archlucid-counters"
      className="space-y-3"
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

      {state.snapshot ? (
        <WhyArchLucidCounterGrid snapshot={state.snapshot} />
      ) : state.loading ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          role="status"
          aria-busy
          aria-label="Loading counters"
        >
          <div className="h-24 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
          <div className="h-24 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
          <div className="h-24 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
        </div>
      ) : null}
    </section>
  );
}
