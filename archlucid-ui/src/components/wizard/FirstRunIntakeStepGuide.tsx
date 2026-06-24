import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

export type FirstRunIntakeStepGuideProps = {
  readonly titleReady: boolean;
  readonly evidenceReady: boolean;
  readonly className?: string;
};

type StepState = "complete" | "current" | "upcoming";

function resolveStepState(complete: boolean, isCurrent: boolean): StepState {
  if (complete) {
    return "complete";
  }

  if (isCurrent) {
    return "current";
  }

  return "upcoming";
}

function stepClassName(state: StepState): string {
  if (state === "complete") {
    return "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100";
  }

  if (state === "current") {
    return "border-teal-500 bg-white text-neutral-900 ring-1 ring-teal-400/60 dark:border-teal-600 dark:bg-neutral-900 dark:text-neutral-100";
  }

  return "border-neutral-200 bg-neutral-50/80 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400";
}

/** Three-step first-run intake guide: name → diagram → optional brief → start. */
export function FirstRunIntakeStepGuide(props: FirstRunIntakeStepGuideProps): ReactElement {
  const { titleReady, evidenceReady, className } = props;

  const titleState = resolveStepState(titleReady, !titleReady);
  const evidenceState = resolveStepState(evidenceReady, titleReady && !evidenceReady);
  const briefState = resolveStepState(false, titleReady && evidenceReady);

  const steps: { readonly key: string; readonly label: string; readonly detail: string; readonly state: StepState }[] =
    [
      {
        key: "name",
        label: "1. Name the review",
        detail: "Short title for this architecture review",
        state: titleState,
      },
      {
        key: "diagram",
        label: "2. Upload one diagram",
        detail: "Architecture diagram, PDF, or design document",
        state: evidenceState,
      },
      {
        key: "brief",
        label: "3. Add context (optional)",
        detail: "Two or three sentences, then start analysis",
        state: briefState,
      },
    ];

  return (
    <ol
      className={cn("m-0 list-none space-y-2 p-0", className)}
      aria-label="First review steps"
      data-testid="first-run-intake-step-guide"
    >
      {steps.map((step) => (
        <li
          key={step.key}
          className={cn("rounded-md border px-3 py-2 text-sm", stepClassName(step.state))}
          data-testid={`first-run-intake-step-${step.key}`}
          data-step-state={step.state}
        >
          <p className="m-0 font-medium">{step.label}</p>
          <p className="m-0 mt-0.5 text-xs leading-snug opacity-90">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}
