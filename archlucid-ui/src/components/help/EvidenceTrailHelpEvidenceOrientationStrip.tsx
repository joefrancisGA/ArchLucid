import { EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE } from "@/lib/evidence-trail-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/evidence-trail` — no diligence Sources list (TB-2092). */
export function EvidenceTrailHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
      data-testid="evidence-trail-help-claim-discipline"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
