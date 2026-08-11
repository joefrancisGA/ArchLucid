import { ProcurementHelpPostureSummary } from "@/components/help/ProcurementHelpPostureSummary";
import { PROCUREMENT_HELP_CLAIM_DISCIPLINE, PROCUREMENT_HELP_LEAD } from "@/lib/procurement-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim discipline and posture summary for `/help/procurement` (no mid-page Sources band — TB-2092). */
export function ProcurementHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <div className="space-y-3" data-testid="procurement-help-orientation">
      <p
        className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="procurement-help-lead"
      >
        {PROCUREMENT_HELP_LEAD}
      </p>

      <aside
        className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
        data-testid="procurement-help-claim-discipline"
      >
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{PROCUREMENT_HELP_CLAIM_DISCIPLINE}</p>
      </aside>

      <ProcurementHelpPostureSummary />
    </div>
  );
}
