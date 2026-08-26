import { SCOPE_HELP_CLAIM_DISCIPLINE } from "@/lib/scope-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/scope` — header info strip (TB-2092). */
export function ScopeHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-scope-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{SCOPE_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
