import { JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE } from "@/lib/jira-integration-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/jira-integration` — header info strip (TB-2092). */
export function JiraIntegrationHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-jira-integration-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{JIRA_INTEGRATION_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
