import { SCOPE_HELP_CLAIM_DISCIPLINE } from "@/lib/scope-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/scope` — no diligence Sources list (TB-2092). */
export function ScopeHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
      data-testid="scope-help-claim-discipline"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{SCOPE_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
