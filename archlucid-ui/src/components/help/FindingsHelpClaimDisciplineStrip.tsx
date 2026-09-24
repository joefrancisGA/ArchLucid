"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { resolveFindingsHelpClaimDiscipline } from "@/lib/findings/findings-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function FindingsHelpClaimDisciplineStrip(): React.JSX.Element {
  const { productLine } = useProductLine();
  const claimDiscipline = resolveFindingsHelpClaimDiscipline(productLine);

  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-findings-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{claimDiscipline}</p>
    </aside>
  );
}
