import { CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE } from "@/lib/connect-gcp-securely-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/cloud-connections/gcp` — header info strip (TB-2092). */
export function ConnectGcpSecurelyHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-connect-gcp-securely-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{CONNECT_GCP_SECURELY_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
