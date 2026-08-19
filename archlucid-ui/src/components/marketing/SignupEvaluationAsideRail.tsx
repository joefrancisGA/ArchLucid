import Link from "next/link";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SIGNUP_ASSURANCE_FACTS,
  SIGNUP_ASSURANCE_HEADING,
  SIGNUP_DEMO_PATH_NOTE,
  SIGNUP_PROCESS_HEADING,
  SIGNUP_PROCESS_STEPS,
} from "@/lib/signup-invite-only-copy";
import { cn } from "@/lib/utils";

/**
 * Right rail on `/signup`: process transparency and evaluation posture.
 * Answers "what happens to my request" and "how does this run" without a sales call.
 */
export function SignupEvaluationAsideRail(): React.JSX.Element {
  return (
    <aside className="space-y-6" data-testid="signup-evaluation-rail">
      <section aria-labelledby="signup-process-heading">
        <h2
          id="signup-process-heading"
          className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}
        >
          {SIGNUP_PROCESS_HEADING}
        </h2>
        <ol className={cn("m-0 mt-3 list-none space-y-3 p-0", MARKETING_TYPOGRAPHY.body)}>
          {SIGNUP_PROCESS_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span
                aria-hidden
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-al-border-subtle text-[11px] font-semibold text-al-text-secondary"
              >
                {index + 1}
              </span>
              <span>
                <span className="font-medium text-al-text-primary">{step.title}. </span>
                <span className="text-al-text-secondary">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className={cn("m-0 mt-4 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>{SIGNUP_DEMO_PATH_NOTE}</p>
        <p className={cn("m-0 mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          <span className="font-medium text-al-text-primary">Inspect first. </span>
          <Link href="/see-it" className={MARKETING_SURFACES.inlineLink}>
            See a sample review
          </Link>{" "}
          — no account required.
        </p>
      </section>

      <section aria-labelledby="signup-assurance-heading">
        <h2
          id="signup-assurance-heading"
          className={cn("m-0 text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}
        >
          {SIGNUP_ASSURANCE_HEADING}
        </h2>
        <ul className={cn("m-0 mt-3 list-none space-y-2 p-0", MARKETING_TYPOGRAPHY.body)}>
          {SIGNUP_ASSURANCE_FACTS.map((fact) => (
            <li key={fact.label}>
              <span className="font-medium text-al-text-primary">{fact.label}. </span>
              <span className="text-al-text-secondary">{fact.detail}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
