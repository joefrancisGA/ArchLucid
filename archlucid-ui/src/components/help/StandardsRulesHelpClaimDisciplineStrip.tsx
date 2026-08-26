import { STANDARDS_RULES_HELP_CLAIM_DISCIPLINE } from "@/lib/standards-rules-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/standards-and-rules` — header info strip (TB-2092). */
export function StandardsRulesHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-standards-rules-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{STANDARDS_RULES_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
