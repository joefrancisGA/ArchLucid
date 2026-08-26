import {
  CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TEST_ID,
  CORE_PILOT_HELP_FIRST_VIEWPORT_JOB_CHROME_TITLE,
  CORE_PILOT_HELP_FIRST_VIEWPORT_PHASES,
} from "@/lib/core-pilot-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** TB-1685 — three-phase first-viewport orientation before the five operational steps below. */
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
      <ol className="m-0 mt-3 grid list-none gap-2 p-0 md:grid-cols-3">
        {CORE_PILOT_HELP_FIRST_VIEWPORT_PHASES.map((phase) => (
          <li
            key={phase.phaseNumber}
            className="rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid={`core-pilot-first-viewport-phase-${phase.phaseNumber}`}
          >
            <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              <span className="sr-only">Phase {phase.phaseNumber} of 3. </span>
              {phase.phaseNumber}. {phase.title}
            </p>
            <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{phase.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
