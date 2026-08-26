import { SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE } from "@/lib/servicenow-integration-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/servicenow-integration` — header info strip (TB-2092). */
export function ServiceNowIntegrationHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-servicenow-integration-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SERVICENOW_INTEGRATION_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
