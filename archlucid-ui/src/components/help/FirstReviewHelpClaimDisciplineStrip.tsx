import { FIRST_REVIEW_HELP_CLAIM_DISCIPLINE } from "@/lib/first-review-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/first-review`. */
export function FirstReviewHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-first-review-claim-discipline"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{FIRST_REVIEW_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
