"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REPEAT_REVIEW_LOOP_HELP_LOOP_HEADING,
  REPEAT_REVIEW_LOOP_HELP_LOOP_STEPS,
  type RepeatReviewLoopHelpLoopStep,
} from "@/lib/repeat-review-loop-help-loop-steps";
import { cn } from "@/lib/utils";

const LOOP_STEP_TOTAL = REPEAT_REVIEW_LOOP_HELP_LOOP_STEPS.length;

function StepOrdinalLabel(props: { readonly stepNumber: number }): React.ReactElement {
  return (
    <span className="sr-only">
      Step {props.stepNumber} of {LOOP_STEP_TOTAL}{" "}
    </span>
  );
}

function LoopStepSecondaryLinks(props: { readonly step: RepeatReviewLoopHelpLoopStep }): React.ReactElement | null {
  if (props.step.secondaryHref === undefined || props.step.secondaryLabel === undefined) {
    return null;
  }

  return (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
      <Link
        href={props.step.secondaryHref}
        className={cn("underline-offset-2 hover:underline", DESIGN_TOKENS.accent.link, OPERATOR_LINK.inline)}
        data-testid={`repeat-review-loop-step-${props.step.stepNumber}-secondary-link`}
      >
        {props.step.secondaryLabel}
      </Link>
    </p>
  );
}

/** Repeat-review loop stepper with deep-link CTAs (TB-1398). */
export function HelpRepeatReviewLoopWorkflowStepper(): React.ReactElement {
  return (
    <section
      aria-labelledby="repeat-review-loop-workflow-heading"
      className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
      data-testid="repeat-review-loop-workflow-stepper"
    >
      <h2 id="repeat-review-loop-workflow-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {REPEAT_REVIEW_LOOP_HELP_LOOP_HEADING}
      </h2>

      <ol className="m-0 list-none space-y-0 p-0">
        {REPEAT_REVIEW_LOOP_HELP_LOOP_STEPS.map((step, index) => {
          const isLast = index === REPEAT_REVIEW_LOOP_HELP_LOOP_STEPS.length - 1;

          return (
            <li key={step.stepNumber} className="relative flex gap-4 pb-6 last:pb-0">
              {!isLast ? (
                <span
                  aria-hidden
                  className="absolute left-[0.9375rem] top-8 h-[calc(100%-1.5rem)] w-px bg-neutral-200 dark:bg-neutral-700"
                />
              ) : null}
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-teal-700/30 bg-teal-50 text-sm font-semibold text-teal-900 dark:border-teal-600/40 dark:bg-teal-950/50 dark:text-teal-100"
              >
                {step.stepNumber}
              </span>
              <div className="min-w-0 flex-1 space-y-2 rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  <StepOrdinalLabel stepNumber={step.stepNumber} />
                  {step.title}
                </h3>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{step.description}</p>
                <Button asChild size="sm" variant="outline" data-testid={`repeat-review-loop-step-${step.stepNumber}-cta`}>
                  <Link href={step.href}>{step.ctaLabel}</Link>
                </Button>
                <LoopStepSecondaryLinks step={step} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
