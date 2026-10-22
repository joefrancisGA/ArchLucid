import {
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE_HEADING,
  ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/architecture-scorecard` — header info strip (TB-2092). */
export function ArchitectureScorecardHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-architecture-scorecard-claim-discipline-strip"
      aria-labelledby={ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={ARCHITECTURE_SCORECARD_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
