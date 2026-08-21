import { cn } from "@/lib/utils";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import type { WhyArchLucidPageState } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { WhyArchLucidExplanationPanel } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidExplanationPanel";
import { WHY_ARCHLUCID_SECTION_SHELL_CLASS } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-section-shell";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type WhyArchLucidRunExplanationSectionProps = {
  readonly state: WhyArchLucidPageState;
};

export function WhyArchLucidRunExplanationSection(props: WhyArchLucidRunExplanationSectionProps) {
  const { state } = props;

  return (
    <section
      aria-labelledby="why-archlucid-explanation-heading"
      data-testid="why-archlucid-run-explanation"
      className={WHY_ARCHLUCID_SECTION_SHELL_CLASS}
    >
      <h2
        id="why-archlucid-explanation-heading"
        className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Architecture review explanation and citations
      </h2>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Aggregate sponsor explanation persisted with the architecture review, with citations back to the Finalized review record, findings,
        decision traces, and evidence bundles that the explainability trace was built from.
      </p>

      {state.explanationError ? (
        <OperatorApiProblem
          problem={state.explanationError.problem}
          fallbackMessage={state.explanationError.message}
          correlationId={state.explanationError.correlationId}
        />
      ) : null}

      {state.explanation ? <WhyArchLucidExplanationPanel summary={state.explanation} /> : null}
    </section>
  );
}
