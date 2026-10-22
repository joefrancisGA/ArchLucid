import { EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE } from "@/lib/evidence-intake-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/evidence-intake` — no diligence Sources list (TB-2092). */
export function EvidenceIntakeHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="evidence-intake-help-claim-discipline"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{EVIDENCE_INTAKE_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
