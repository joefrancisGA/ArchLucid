import {
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import { ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID } from "@/lib/architecture-intelligence-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/architecture-intelligence` — header info strip (TB-2092). */
export function ArchitectureIntelligenceHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-architecture-intelligence-claim-discipline-strip"
      aria-labelledby={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_INTELLIGENCE_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
