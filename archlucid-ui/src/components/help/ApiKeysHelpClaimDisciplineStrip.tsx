import { API_KEYS_HELP_CLAIM_DISCIPLINE } from "@/lib/api-keys-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/api-keys` — header info strip (TB-2092). */
export function ApiKeysHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-api-keys-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{API_KEYS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
