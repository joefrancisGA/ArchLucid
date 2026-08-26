import { AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE } from "@/lib/audit-trail-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/audit-trail` — header info strip (TB-2092). */
export function AuditTrailHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-audit-trail-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{AUDIT_TRAIL_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
