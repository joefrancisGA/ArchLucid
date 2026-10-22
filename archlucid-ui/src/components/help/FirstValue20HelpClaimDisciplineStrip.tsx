import { FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE } from "@/lib/first-value-20-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/first-value-20-minutes` — header info strip (TB-2092). */
export function FirstValue20HelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-first-value-20-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{FIRST_VALUE_20_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
