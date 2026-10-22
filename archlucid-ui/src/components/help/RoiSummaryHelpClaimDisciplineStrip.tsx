import { ROI_SUMMARY_HELP_CLAIM_DISCIPLINE } from "@/lib/roi-summary-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/roi-summary` — header info strip (TB-2092). */
export function RoiSummaryHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-roi-summary-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ROI_SUMMARY_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
