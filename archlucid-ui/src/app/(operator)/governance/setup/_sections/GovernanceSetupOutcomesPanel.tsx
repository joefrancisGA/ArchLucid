import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_SETUP_OUTCOMES_HEADING,
  GOVERNANCE_SETUP_OUTCOMES_INTRO,
} from "@/lib/governance/governance-setup-route";

/** Secondary rail — operating-loop framing without duplicating per-step outcome sentences. */
export function GovernanceSetupOutcomesPanel() {
  return (
    <aside
      className="h-fit rounded-md border border-neutral-200 p-4 lg:sticky lg:top-[calc(var(--app-shell-sticky,6rem)+0.5rem)] dark:border-neutral-800"
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
    </aside>
  );
}
