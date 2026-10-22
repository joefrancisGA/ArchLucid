import { COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE } from "@/lib/comparison-replay-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/comparison-replay` — header info strip (TB-2092). */
export function ComparisonReplayHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-comparison-replay-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{COMPARISON_REPLAY_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
