import { CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE } from "@/lib/connection-status-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/connection-status` — header info strip (TB-2092). */
export function ConnectionStatusHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-connection-status-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{CONNECTION_STATUS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
