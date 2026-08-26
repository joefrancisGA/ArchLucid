import { CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE } from "@/lib/connect-aws-securely-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/cloud-connections/aws` — header info strip (TB-2092). */
export function ConnectAwsSecurelyHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-connect-aws-securely-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{CONNECT_AWS_SECURELY_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
