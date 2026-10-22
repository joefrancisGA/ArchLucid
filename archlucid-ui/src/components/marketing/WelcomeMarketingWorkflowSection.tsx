import {
  WELCOME_WORKFLOW_INTRO,
  WELCOME_WORKFLOW_STEPS,
} from "@/components/marketing/welcome-marketing-copy";
import { MARKETING_LAYOUT, MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Six-stage marketing workflow — horizontal timeline on wide screens. */
export function WelcomeMarketingWorkflowSection() {
  return (
    <section
      aria-labelledby="welcome-workflow-heading"
      className={cn(MARKETING_LAYOUT.sectionStack, MARKETING_MOTION.revealIn)}
      data-testid="welcome-core-workflow"
    >
      <h2 id="welcome-workflow-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
        Core workflow
      </h2>
      <p className={cn("mt-3 max-w-3xl leading-relaxed text-al-text-secondary", MARKETING_TYPOGRAPHY.lead)}>
        {WELCOME_WORKFLOW_INTRO}
      </p>
      <ol className="mt-8 flex list-none flex-col gap-0 p-0 lg:flex-row lg:items-stretch lg:gap-0">
        {WELCOME_WORKFLOW_STEPS.map((step, index) => (
          <li
            key={step.id}
            className="relative flex min-w-0 flex-1 flex-col lg:px-2"
            data-testid={`welcome-workflow-step-${step.id}`}
          >
            <div className="flex items-start gap-3 lg:flex-col lg:items-stretch lg:gap-0">
              <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                <span className={MARKETING_SURFACES.stepIndicator} aria-hidden>
                  {index + 1}
                </span>
                {index < WELCOME_WORKFLOW_STEPS.length - 1 ? (
                  <span
                    className="hidden h-px flex-1 bg-neutral-200 dark:bg-neutral-700 lg:block lg:h-px lg:w-full"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 pb-6 lg:pt-3 lg:pb-0">
                <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
                  {step.label}
                </p>
                <p className={cn("m-0 mt-2 leading-snug text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
                  {step.summary}
                </p>
              </div>
            </div>
            {index < WELCOME_WORKFLOW_STEPS.length - 1 ? (
              <span className="ms-5 block h-4 w-px bg-neutral-200 dark:bg-neutral-700 lg:hidden" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
