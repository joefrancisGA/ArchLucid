import { SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE } from "@/lib/system-health-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/system-health` — header info strip (TB-2092). */
export function SystemHealthHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-system-health-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SYSTEM_HEALTH_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
