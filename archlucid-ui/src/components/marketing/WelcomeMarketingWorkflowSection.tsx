import {
  WELCOME_WORKFLOW_INTRO,
  WELCOME_WORKFLOW_STEPS,
} from "@/components/marketing/welcome-marketing-copy";

/** Six-stage marketing workflow strip (Capture → … → Report). */
export function WelcomeMarketingWorkflowSection() {
  return (
    <section
      aria-labelledby="welcome-workflow-heading"
      className="mb-12"
      data-testid="welcome-core-workflow"
    >
      <h2 id="welcome-workflow-heading" className={cn("font-semibold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.pageTitle)}>
        Core workflow
      </h2>
      <p className={cn("mt-2 max-w-3xl leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {WELCOME_WORKFLOW_INTRO}
      </p>
      <ol className="mt-6 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {WELCOME_WORKFLOW_STEPS.map((step, index) => (
          <li
            key={step.id}
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            data-testid={`welcome-workflow-step-${step.id}`}
          >
            <p className={cn("m-0 font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper)}>
              {index + 1}. {step.label}
            </p>
            <p className={cn("m-0 mt-2 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{step.summary}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
