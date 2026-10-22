import { DIGESTS_HELP_CLAIM_DISCIPLINE } from "@/lib/digests-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/digests` — header info strip (TB-2092). */
export function DigestsHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-digests-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{DIGESTS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
