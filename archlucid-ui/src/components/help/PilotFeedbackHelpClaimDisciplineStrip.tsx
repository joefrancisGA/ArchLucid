import { PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE } from "@/lib/pilot-feedback-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/pilot-feedback` — header info strip (TB-2092). */
export function PilotFeedbackHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-pilot-feedback-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{PILOT_FEEDBACK_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
