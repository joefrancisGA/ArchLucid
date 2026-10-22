"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { resolveIntegrationReadinessHelpClaimDiscipline } from "@/lib/integration-readiness-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/integration-readiness` — header info strip (TB-2092). */
export function IntegrationReadinessHelpClaimDisciplineStrip(): React.JSX.Element {
  const { productLine } = useProductLine();
  const claimDiscipline = resolveIntegrationReadinessHelpClaimDiscipline(productLine);

  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-integration-readiness-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{claimDiscipline}</p>
    </aside>
  );
}
