import { BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE } from "@/lib/billing-and-plans-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/billing-and-plans` — header info strip (TB-2092). */
export function BillingAndPlansHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-billing-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{BILLING_AND_PLANS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
