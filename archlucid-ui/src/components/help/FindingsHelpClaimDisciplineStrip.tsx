import { FINDINGS_HELP_CLAIM_DISCIPLINE } from "@/lib/findings/findings-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/findings` — header info strip (TB-2092). */
export function FindingsHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-findings-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{FINDINGS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
