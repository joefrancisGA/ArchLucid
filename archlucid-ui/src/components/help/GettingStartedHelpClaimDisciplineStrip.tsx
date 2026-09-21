import { StatusTag } from "@/components/ui/status-tag";
import { resolveGettingStartedHelpClaimDiscipline } from "@/lib/getting-started-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/getting-started` — header info strip (TB-2092). */
export function GettingStartedHelpClaimDisciplineStrip(): React.JSX.Element {
  const claimDiscipline = resolveGettingStartedHelpClaimDiscipline(resolveProductLineIdFromEnv());

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
