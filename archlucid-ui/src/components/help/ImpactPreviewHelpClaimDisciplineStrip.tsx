import {
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE,
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/impact-preview-help-evidence-copy";
import { IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID } from "@/lib/impact-preview-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/impact-preview` — header info strip (TB-2092). */
export function ImpactPreviewHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-impact-preview-claim-discipline-strip"
      aria-labelledby={IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={IMPACT_PREVIEW_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
