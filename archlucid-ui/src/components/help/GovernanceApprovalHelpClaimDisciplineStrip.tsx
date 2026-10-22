import { GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE } from "@/lib/governance/governance-approval-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/governance-approval` — header info strip (TB-2092). */
export function GovernanceApprovalHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-governance-approval-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{GOVERNANCE_APPROVAL_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
