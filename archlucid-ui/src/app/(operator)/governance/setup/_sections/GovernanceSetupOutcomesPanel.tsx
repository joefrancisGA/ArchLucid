import { cn } from "@/lib/utils";

import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_SETUP_OUTCOMES_HEADING,
  GOVERNANCE_SETUP_OUTCOMES_INTRO,
  GOVERNANCE_SETUP_OUTCOME_BULLETS,
} from "@/lib/governance-setup-route";

/** Sticky value rail — fills empty horizontal space without Pending status theater. */
export function GovernanceSetupOutcomesPanel() {
  return (
    <aside
      className={cn(DESIGN_TOKENS.banner.page, "h-fit lg:sticky lg:top-[calc(var(--app-shell-sticky,6rem)+0.5rem)]")}
      data-testid="governance-setup-outcomes-panel"
      aria-labelledby="governance-setup-outcomes-heading"
    >
      <h2
        id="governance-setup-outcomes-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {GOVERNANCE_SETUP_OUTCOMES_HEADING}
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {GOVERNANCE_SETUP_OUTCOMES_INTRO}
      </p>
      <ul className="m-0 mt-3 list-none space-y-2 p-0">
        {GOVERNANCE_SETUP_OUTCOME_BULLETS.map((bullet) => (
          <li key={bullet} className={cn("flex gap-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <span className="shrink-0 font-semibold text-[var(--al-accent-interactive)]" aria-hidden>
              →
            </span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
