import { CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE } from "@/lib/cloud-connections-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/cloud-connections` — header info strip (TB-2092). */
export function CloudConnectionsHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-cloud-connections-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
