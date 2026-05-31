import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import type { WhyArchLucidPageState } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { WhyArchLucidCounterGrid } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidCounterGrid";

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
      <h2
        id="why-archlucid-counters-heading"
        className="text-sm font-semibold text-al-text-primary"
      >
        Process counters
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Cumulative <code>ArchLucidInstrumentation</code> counters since the API host started, plus the in-scope audit row
        count for the demo tenant.
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
