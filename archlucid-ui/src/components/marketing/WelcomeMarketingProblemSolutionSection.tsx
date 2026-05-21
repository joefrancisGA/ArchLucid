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
        <article className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{WELCOME_PROBLEM_HEADING}</h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{WELCOME_PROBLEM_BODY}</p>
        </article>
        <article className="rounded-lg border border-teal-200/80 bg-teal-50/40 p-5 dark:border-teal-900/50 dark:bg-teal-950/25">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{WELCOME_SOLUTION_HEADING}</h3>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{WELCOME_SOLUTION_BODY}</p>
        </article>
      </div>
    </section>
  );
}
