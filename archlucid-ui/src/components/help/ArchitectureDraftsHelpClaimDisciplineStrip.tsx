import { ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE } from "@/lib/architecture-drafts-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/architecture-drafts` — header info strip (TB-2092). */
export function ArchitectureDraftsHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-architecture-drafts-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
