import { REVIEW_PACKAGES_HELP_EXPORT_BUYER_CLAIM } from "@/lib/review-packages-help-export-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/review-packages` — header info strip (TB-2092). */
export function ReviewPackagesHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-review-packages-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{REVIEW_PACKAGES_HELP_EXPORT_BUYER_CLAIM}</p>
    </aside>
  );
}
