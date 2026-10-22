import {
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE,
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/model-governance-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID } from "@/lib/model-governance-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/model-governance` — header info strip (TB-2092). */
export function ModelGovernanceHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-model-governance-claim-discipline-strip"
      aria-labelledby={MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={MODEL_GOVERNANCE_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
