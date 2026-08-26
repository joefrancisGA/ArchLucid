import { SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE } from "@/lib/slack-integration-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/slack-integration` — header info strip (TB-2092). */
export function SlackIntegrationHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-slack-integration-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SLACK_INTEGRATION_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
