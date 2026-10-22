import { WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE } from "@/lib/webhooks-integration-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/webhooks-integration` — header info strip (TB-2092). */
export function WebhooksIntegrationHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-webhooks-integration-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
