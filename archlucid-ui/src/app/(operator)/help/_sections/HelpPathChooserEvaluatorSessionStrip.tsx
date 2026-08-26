import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PATH_CHOOSER_HELP_EVALUATOR_SESSION_STEPS } from "@/lib/path-chooser-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Ordered evaluator session steps for `/help/path-chooser` (TB-1345). */
export function HelpPathChooserEvaluatorSessionStrip(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-path-chooser-evaluator-session-heading"
      data-testid="help-path-chooser-evaluator-session"
      id="evaluator-session-flow"
    >
      <h2
        id="help-path-chooser-evaluator-session-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Evaluator session flow
      </h2>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Work through these four steps in order when you are evaluating ArchLucid before procurement or sponsor
        handoff.
      </p>
      <ol className="m-0 mt-3 grid list-none gap-3 p-0 sm:grid-cols-2">
        {PATH_CHOOSER_HELP_EVALUATOR_SESSION_STEPS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid={`help-path-chooser-evaluator-session-step-${index + 1}`}
          >
            <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {index + 1}. {step.title}
            </p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{step.body}</p>
            <div className="mt-2">
              <Button asChild size="sm" variant={index === 1 ? "primary" : "outline"}>
                <Link href={step.action.href}>{step.action.label}</Link>
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
