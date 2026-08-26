import {
  IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE,
  IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/improvement-planning-help-evidence-copy";
import { IMPROVEMENT_PLANNING_HELP_CLAIM_HEADING_ID } from "@/lib/improvement-planning-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/improvement-planning` — header info strip (TB-2092). */
export function ImprovementPlanningHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-improvement-planning-claim-discipline-strip"
      aria-labelledby={IMPROVEMENT_PLANNING_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={IMPROVEMENT_PLANNING_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{IMPROVEMENT_PLANNING_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
