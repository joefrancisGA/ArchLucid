import { AZURE_BOARDS_HELP_CLAIM_DISCIPLINE } from "@/lib/azure-boards-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/azure-boards` — header info strip (TB-2092). */
export function AzureBoardsHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-azure-boards-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{AZURE_BOARDS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
