import {
  CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TEST_ID,
  CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TITLE,
  CORE_PILOT_HELP_FIRST_VIEWPORT_STEPS,
} from "@/lib/core-pilot-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** TB-1685 — three-step first-viewport job chrome before optional paths and Related guides. */
export function HelpCorePilotFirstViewportJobChrome(): React.JSX.Element {
  return (
    <section
      aria-labelledby="core-pilot-first-viewport-job-chrome-heading"
      data-testid={CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TEST_ID}
    >
      <h2
        id="core-pilot-first-viewport-job-chrome-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TITLE}
      </h2>
      <ol className="m-0 mt-3 grid list-none gap-3 p-0 md:grid-cols-3">
        {CORE_PILOT_HELP_FIRST_VIEWPORT_STEPS.map((step) => (
          <li
            key={step.stepNumber}
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid={`core-pilot-first-viewport-step-${step.stepNumber}`}
          >
            <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              <span className="sr-only">Step {step.stepNumber} of 3. </span>
              {step.stepNumber}. {step.title}
            </p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
