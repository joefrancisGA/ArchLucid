import { CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE } from "@/lib/connect-azure-securely-help-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/cloud-connections/azure` — header info strip (TB-2092). */
export function ConnectAzureSecurelyHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-connect-azure-securely-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{CONNECT_AZURE_SECURELY_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
