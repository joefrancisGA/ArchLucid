import { SUBPROCESSORS_HELP_CLAIM_DISCIPLINE } from "@/lib/subprocessors-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/subprocessors` — header info strip (TB-2092). */
export function SubprocessorsHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-subprocessors-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SUBPROCESSORS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
