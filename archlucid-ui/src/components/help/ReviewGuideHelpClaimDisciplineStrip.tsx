import { REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE } from "@/lib/review-guide-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/review-guide` — header info strip (TB-2092). */
export function ReviewGuideHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-review-guide-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{REVIEW_GUIDE_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
