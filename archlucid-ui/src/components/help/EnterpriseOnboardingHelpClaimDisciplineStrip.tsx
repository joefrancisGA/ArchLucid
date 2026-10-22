import { ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE } from "@/lib/enterprise-onboarding-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/enterprise-onboarding` — header info strip (TB-2092). */
export function EnterpriseOnboardingHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-enterprise-onboarding-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ENTERPRISE_ONBOARDING_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
