import { SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE } from "@/lib/soc2-self-assessment-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const SOC2_SELF_ASSESSMENT_HELP_CLAIM_HEADING_ID = "help-soc2-self-assessment-claim-discipline-heading" as const;

/** Claim-discipline orientation for `/help/soc2-self-assessment` — header info strip (TB-2092). */
export function Soc2SelfAssessmentHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-soc2-self-assessment-claim-discipline-strip"
      aria-labelledby={SOC2_SELF_ASSESSMENT_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={SOC2_SELF_ASSESSMENT_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        Self-assessment only
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{SOC2_SELF_ASSESSMENT_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
