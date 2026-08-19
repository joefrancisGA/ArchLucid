import {
  WELCOME_HERO_DIFFERENTIATORS,
  WELCOME_PROBLEM_BODY,
  WELCOME_PROBLEM_HEADING,
  WELCOME_SOLUTION_BODY,
  WELCOME_SOLUTION_HEADING,
} from "@/components/marketing/welcome-marketing-copy";
import { MARKETING_LAYOUT, MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Problem → solution framing for the public homepage (service-led wedge). */
export function WelcomeMarketingProblemSolutionSection() {
  return (
    <section
      aria-labelledby="welcome-problem-solution-heading"
      className={cn(MARKETING_LAYOUT.sectionStack, MARKETING_MOTION.revealIn)}
      data-testid="welcome-problem-solution"
    >
      <h2 id="welcome-problem-solution-heading" className="sr-only">
        Problem and solution
      </h2>
      <ul
        className={cn(
          "grid list-disc gap-x-8 gap-y-1 ps-5 text-al-text-secondary marker:text-teal-700 sm:grid-cols-2 dark:marker:text-teal-300",
          MARKETING_TYPOGRAPHY.meta,
        )}
        data-testid="welcome-hero-differentiators"
      >
        {WELCOME_HERO_DIFFERENTIATORS.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="grid gap-6 md:grid-cols-2">
        <article
          className={cn(
            MARKETING_SURFACES.cardComfort,
            "border-l-4 border-neutral-400 dark:border-neutral-500",
          )}
        >
          <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>{WELCOME_PROBLEM_HEADING}</h3>
          <p className={cn("mt-3 leading-relaxed text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            {WELCOME_PROBLEM_BODY}
          </p>
        </article>
        <article className={MARKETING_SURFACES.cardComfort}>
          <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>{WELCOME_SOLUTION_HEADING}</h3>
          <p className={cn("mt-3 leading-relaxed text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            {WELCOME_SOLUTION_BODY}
          </p>
        </article>
      </div>
    </section>
  );
}
