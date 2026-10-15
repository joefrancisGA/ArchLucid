"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";

import { cloudConnectionsHelpClaimDiscipline } from "@/lib/cloud-connections-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/cloud-connections` — header info strip (TB-2092). */
export function CloudConnectionsHelpClaimDisciplineStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-cloud-connections-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{cloudConnectionsHelpClaimDiscipline(productLine)}</p>
    </aside>
  );
}
