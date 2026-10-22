import {
  STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE,
  STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/structured-brief-help-evidence-copy";
import { STRUCTURED_BRIEF_HELP_CLAIM_HEADING_ID } from "@/lib/structured-brief-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/structured-brief` — header info strip (TB-2092). */
export function StructuredBriefHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-structured-brief-claim-discipline-strip"
      aria-labelledby={STRUCTURED_BRIEF_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={STRUCTURED_BRIEF_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{STRUCTURED_BRIEF_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
