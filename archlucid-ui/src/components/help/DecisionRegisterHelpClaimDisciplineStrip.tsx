import {
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE,
  DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/decision-register-help-evidence-copy";
import { DECISION_REGISTER_HELP_CLAIM_HEADING_ID } from "@/lib/decision-register-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/decision-register` — header info strip (TB-2092). */
export function DecisionRegisterHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-decision-register-claim-discipline-strip"
      aria-labelledby={DECISION_REGISTER_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={DECISION_REGISTER_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {DECISION_REGISTER_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{DECISION_REGISTER_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
