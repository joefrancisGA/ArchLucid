import { REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE } from "@/lib/repeat-review-loop-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/repeat-review-loop` — header info strip (TB-2092). */
export function RepeatReviewLoopHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-repeat-review-loop-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{REPEAT_REVIEW_LOOP_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
