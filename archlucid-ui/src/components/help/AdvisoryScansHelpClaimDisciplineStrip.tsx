import { ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE } from "@/lib/advisory-scans-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/advisory-scans` — header info strip (TB-2092). */
export function AdvisoryScansHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-advisory-scans-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ADVISORY_SCANS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
