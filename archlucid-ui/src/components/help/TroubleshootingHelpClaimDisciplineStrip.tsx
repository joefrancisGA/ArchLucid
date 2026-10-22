import { TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE } from "@/lib/troubleshooting-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/troubleshooting` — header info strip (TB-2092). */
export function TroubleshootingHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-troubleshooting-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
