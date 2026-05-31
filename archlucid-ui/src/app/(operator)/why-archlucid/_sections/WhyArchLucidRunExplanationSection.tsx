import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import type { WhyArchLucidPageState } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { WhyArchLucidExplanationPanel } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidExplanationPanel";

export type WhyArchLucidRunExplanationSectionProps = {
  readonly state: WhyArchLucidPageState;
};

export function WhyArchLucidRunExplanationSection(props: WhyArchLucidRunExplanationSectionProps) {
  const { state } = props;

  return (
    <section
      aria-labelledby="why-archlucid-explanation-heading"
      data-testid="why-archlucid-run-explanation"
      className="space-y-3"
    >
      <h2
        id="why-archlucid-explanation-heading"
        className="text-sm font-semibold text-al-text-primary"
      >
        Architecture review explanation and citations
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Aggregate executive explanation persisted with the architecture review, with citations back to the manifest, findings,
        decision traces, and evidence bundles that the explainability trace was built from.
      </p>

      {state.explanationError ? (
        <OperatorApiProblem
          problem={state.explanationError.problem}
          fallbackMessage={state.explanationError.message}
          correlationId={state.explanationError.correlationId}
        />
      ) : null}

      {state.explanation ? (
        <WhyArchLucidExplanationPanel summary={state.explanation} />
      ) : !state.explanationError && state.loading ? (
        <div className="space-y-3" role="status" aria-busy aria-label="Loading architecture review explanation">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="h-16 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
            <div className="h-16 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
            <div className="h-16 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
            <div className="h-16 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
          </div>
          <div className="h-24 animate-pulse rounded border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60" />
        </div>
      ) : null}
    </section>
  );
}
