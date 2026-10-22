import { DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE } from "@/lib/dpa-template-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const DPA_TEMPLATE_HELP_CLAIM_HEADING_ID = "help-dpa-template-claim-discipline-heading" as const;

/** Claim-discipline orientation for `/help/dpa-template` — header info strip (TB-2092). */
export function DpaTemplateHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-dpa-template-claim-discipline-strip"
      aria-labelledby={DPA_TEMPLATE_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={DPA_TEMPLATE_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Negotiation template only
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
