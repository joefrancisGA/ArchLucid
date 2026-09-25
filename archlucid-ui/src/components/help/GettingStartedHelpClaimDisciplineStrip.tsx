"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { StatusTag } from "@/components/ui/status-tag";
import { resolveGettingStartedHelpClaimDiscipline } from "@/lib/getting-started-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function GettingStartedHelpClaimDisciplineStrip(): React.JSX.Element {
  const { productLine } = useProductLine();
  const claimDiscipline = resolveGettingStartedHelpClaimDiscipline(productLine);

  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-getting-started-claim-discipline-strip"
    >
      <StatusTag
        kind="neutral"
        label="Orientation only"
        data-testid="help-getting-started-orientation-status"
      />
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{claimDiscipline}</p>
    </aside>
  );
}
