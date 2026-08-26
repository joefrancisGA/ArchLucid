import { SECURITY_TRUST_HELP_CLAIM_DISCIPLINE } from "@/lib/security-trust-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/security-trust` — header info strip (TB-2092). */
export function SecurityTrustHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-security-trust-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SECURITY_TRUST_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
