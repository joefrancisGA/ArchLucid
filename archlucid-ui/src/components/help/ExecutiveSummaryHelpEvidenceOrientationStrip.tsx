import { EXECUTIVE_SUMMARY_HELP_CLAIM_DISCIPLINE } from "@/lib/executive/executive-summary-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim discipline for `/help/executive-summary`. */
export function ExecutiveSummaryHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className={cn(DESIGN_TOKENS.callout.warn, "p-3")} data-testid="help-executive-summary-claim-discipline">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{EXECUTIVE_SUMMARY_HELP_CLAIM_DISCIPLINE}</p>
    </div>
  );
}
