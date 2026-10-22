import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE } from "@/lib/engineering-troubleshooting-help-guide-content";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/engineering-troubleshooting` — header info strip (TB-2092). */
export function EngineeringTroubleshootingHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-engineering-troubleshooting-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ENGINEERING_TROUBLESHOOTING_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
