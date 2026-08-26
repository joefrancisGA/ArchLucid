import { ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_COPY } from "@/lib/accelerator-chooser-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/accelerator-chooser` — header info strip (TB-2092). */
export function AcceleratorChooserHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-accelerator-chooser-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE_COPY}</p>
    </aside>
  );
}
