"use client";

import { cn } from "@/lib/utils";
import { BUYER_CTO_DEMO_AGENDA_HEADING, BUYER_CTO_DEMO_AGENDA_SUBTEXT } from "@/lib/buyer/buyer-polish-copy";
import { BUYER_CTO_DEMO_STEP_BUDGET_MINUTES } from "@/lib/buyer/buyer-cto-demo-tour";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer/buyer-golden-journey-nav";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const agendaTotalMinutes = BUYER_CTO_DEMO_STEP_BUDGET_MINUTES.reduce((sum, minutes) => sum + minutes, 0);

/** Ten-second run-of-show overview shown before the presenter begins step 1. */
export function CtoDemoAgendaPreviewCard(): React.JSX.Element {
  return (
    <section
      aria-labelledby="cto-demo-agenda-heading"
      className={cn("rounded-md border p-3", DESIGN_TOKENS.surface.card)}
      data-testid="cto-demo-agenda-preview"
    >
      <h3 id="cto-demo-agenda-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {BUYER_CTO_DEMO_AGENDA_HEADING}
      </h3>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_CTO_DEMO_AGENDA_SUBTEXT}</p>
      <ol className={cn("m-0 mt-3 list-decimal space-y-1 pl-4 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        {BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.map((def, index) => {
          const budget = BUYER_CTO_DEMO_STEP_BUDGET_MINUTES[index] ?? 0;

          return (
            <li key={def.href}>
              <span className="font-medium">{def.label}</span>
              <span className="text-neutral-500 dark:text-neutral-400"> · ~{budget} min</span>
            </li>
          );
        })}
      </ol>
      <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.badge, "text-neutral-600 dark:text-neutral-400")}>
        ~{agendaTotalMinutes} min on the golden path · ~4 min buffer for open and close
      </p>
    </section>
  );
}
