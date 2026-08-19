import { DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE } from "@/lib/data-handling-tenant-isolation-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim discipline callout for `/help/data-handling`. */
export function HelpDataHandlingTenantIsolationClaimDiscipline(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.warn, "p-3")}
      data-testid="help-data-handling-tenant-isolation-claim-discipline"
    >
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {DATA_HANDLING_TENANT_ISOLATION_HELP_CLAIM_DISCIPLINE}
      </p>
    </aside>
  );
}
