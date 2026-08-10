import { PILOT_GUIDE_HELP_CLAIM_DISCIPLINE } from "@/lib/pilot-guide-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/pilot-guide` — no diligence Sources list (TB-2092). */
export function PilotGuideHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <aside className={cn(DESIGN_TOKENS.callout.warn, "p-3")} data-testid="pilot-guide-help-claim-discipline">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{PILOT_GUIDE_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
