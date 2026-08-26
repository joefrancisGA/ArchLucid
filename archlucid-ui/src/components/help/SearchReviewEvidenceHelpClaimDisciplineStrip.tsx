import {
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE,
  SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/search-review-evidence-help-evidence-copy";
import { SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID } from "@/lib/search-review-evidence-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/search-review-evidence` — header info strip (TB-2092). */
export function SearchReviewEvidenceHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-search-review-evidence-claim-discipline-strip"
      aria-labelledby={SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{SEARCH_REVIEW_EVIDENCE_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
