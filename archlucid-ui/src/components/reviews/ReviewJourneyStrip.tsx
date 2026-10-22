import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ReviewJourneyStep = "evidence" | "analyze" | "findings" | "decisions" | "share";

const STEPS: readonly { readonly id: ReviewJourneyStep; readonly label: string }[] = [
  { id: "evidence", label: "Evidence" },
  { id: "analyze", label: "Analyze" },
  { id: "findings", label: "Findings" },
  { id: "decisions", label: "Decisions" },
  { id: "share", label: "Share" },
];

const STEP_GUIDANCE: Readonly<Record<ReviewJourneyStep, string>> = {
  evidence: "Add evidence before analysis can finish.",
  analyze: "Analysis is still in progress.",
  findings: "Review findings before you record decisions.",
  decisions: "Record decisions before you can finalize.",
  share: "Finalize to lock the architecture package.",
};

export function ReviewJourneyStrip(props: {
  readonly currentStep: ReviewJourneyStep;
  readonly isSealed: boolean;
}): React.JSX.Element | null {
  if (props.isSealed) {
    return null;
  }

  const currentIndex = STEPS.findIndex((step) => step.id === props.currentStep);

  return (
    <section
      className="space-y-2"
      aria-label="Review progress"
      data-testid="review-journey-strip"
    >
      <ol className="m-0 grid list-none grid-cols-5 gap-1 p-0">
        {STEPS.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "border-t-2 pt-1 text-center",
              index < currentIndex
                ? "border-al-accent-interactive text-al-text-primary"
                : index === currentIndex
                  ? "border-al-accent-interactive font-semibold text-al-text-primary"
                  : "border-border text-al-text-secondary",
              OPERATOR_TYPOGRAPHY.micro,
            )}
            data-current={index === currentIndex ? "true" : undefined}
          >
            {step.label}
          </li>
        ))}
      </ol>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {STEP_GUIDANCE[props.currentStep]}
      </p>
    </section>
  );
}

export function resolveReviewJourneyStep(status: {
  readonly kind: string;
  readonly label: string;
}): ReviewJourneyStep {
  const label = status.label.toLowerCase();

  if (status.kind === "draft" || label.includes("evidence")) {
    return "evidence";
  }
  if (status.kind === "analysis-in-progress" || label.includes("progress")) {
    return "analyze";
  }
  if (status.kind === "review-complete" || status.kind === "quality-gate-rejected") {
    return "findings";
  }
  if (status.kind === "awaiting-decision" || status.kind === "changes-requested") {
    return "decisions";
  }
  return "share";
}

export function ReviewObjectSentence(props: {
  readonly isSealed: boolean;
}): React.JSX.Element {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="review-object-sentence"
    >
      {props.isSealed
        ? "This review is sealed. The architecture package is locked."
        : "This review is still open. Finalize locks the architecture package."}
    </p>
  );
}
