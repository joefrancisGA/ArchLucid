import { AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE } from "@/lib/azure-permissions-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/azure-permissions` — no diligence Sources list (TB-2092). */
export function AzurePermissionsHelpEvidenceOrientationStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
      data-testid="azure-permissions-help-claim-discipline"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
