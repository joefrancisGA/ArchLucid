import { SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE } from "@/lib/sponsor/sponsor-report-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/sponsor-report` — header info strip (TB-2092). */
export function SponsorSummaryHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-sponsor-report-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SPONSOR_SUMMARY_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
