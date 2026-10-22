import {
  AI_USAGE_HELP_CLAIM_DISCIPLINE,
  AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/ai-usage-help-evidence-copy";
import { AI_USAGE_HELP_CLAIM_HEADING_ID } from "@/lib/ai-usage-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/ai-usage` — header info strip (TB-2092). */
export function AiUsageHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-ai-usage-claim-discipline-strip"
      aria-labelledby={AI_USAGE_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={AI_USAGE_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {AI_USAGE_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{AI_USAGE_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
