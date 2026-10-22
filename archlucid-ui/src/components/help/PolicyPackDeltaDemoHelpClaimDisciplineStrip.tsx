import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE } from "@/lib/policy/policy-pack-delta-demo-help-guide-content";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/policy-pack-delta-demo` — header info strip (TB-2092). */
export function PolicyPackDeltaDemoHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-policy-pack-delta-demo-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{POLICY_PACK_DELTA_DEMO_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
