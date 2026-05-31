import {
  WELCOME_PROBLEM_BODY,
  WELCOME_PROBLEM_HEADING,
  WELCOME_SOLUTION_BODY,
  WELCOME_SOLUTION_HEADING,
} from "@/components/marketing/welcome-marketing-copy";

/** Problem → solution framing for the public homepage (service-led wedge). */
export function WelcomeMarketingProblemSolutionSection() {
  return (
    <section
      aria-labelledby="welcome-problem-solution-heading"
      className="mb-12"
      data-testid="welcome-problem-solution"
    >
      <h2 id="welcome-problem-solution-heading" className="sr-only">
        Problem and solution
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        <article className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 p-5">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{WELCOME_PROBLEM_HEADING}</h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{WELCOME_PROBLEM_BODY}</p>
        </article>
        <article className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-5">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{WELCOME_SOLUTION_HEADING}</h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{WELCOME_SOLUTION_BODY}</p>
        </article>
      </div>
    </section>
  );
}
