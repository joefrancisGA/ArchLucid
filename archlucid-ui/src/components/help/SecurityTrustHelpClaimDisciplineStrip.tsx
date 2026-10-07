import {
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE,
  SECURITY_TRUST_HELP_CLAIM_DISCIPLINE_HEADING,
  SECURITY_TRUST_HELP_CLAIM_HEADING_ID,
} from "@/lib/security-trust-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/security-trust` — header info strip (TB-2092). */
export function SecurityTrustHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-security-trust-claim-discipline-strip"
      aria-labelledby={SECURITY_TRUST_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={SECURITY_TRUST_HELP_CLAIM_HEADING_ID}
        className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "m-0 scroll-mt-24", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {SECURITY_TRUST_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{SECURITY_TRUST_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
