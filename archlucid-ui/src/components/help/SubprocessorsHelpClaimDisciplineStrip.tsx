import {
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
  SUBPROCESSORS_HELP_CLAIM_DISCIPLINE_HEADING,
  SUBPROCESSORS_HELP_CLAIM_HEADING_ID,
} from "@/lib/subprocessors-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/subprocessors` — header info strip (TB-2092). */
export function SubprocessorsHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-subprocessors-claim-discipline-strip"
      aria-labelledby={SUBPROCESSORS_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={SUBPROCESSORS_HELP_CLAIM_HEADING_ID}
        className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "m-0 scroll-mt-24", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {SUBPROCESSORS_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{SUBPROCESSORS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
