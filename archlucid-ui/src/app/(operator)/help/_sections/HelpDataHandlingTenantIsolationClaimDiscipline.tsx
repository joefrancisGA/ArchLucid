import { resolveDataHandlingTenantIsolationHelpClaimDiscipline } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import { cn } from "@/lib/utils";

/** Claim discipline callout for `/help/data-handling`. */
export function HelpDataHandlingTenantIsolationClaimDiscipline(): React.JSX.Element {
  const claimDiscipline = resolveDataHandlingTenantIsolationHelpClaimDiscipline(resolveProductLineIdFromEnv());

  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
      data-testid="help-data-handling-tenant-isolation-claim-discipline"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{claimDiscipline}</p>
    </aside>
  );
}
