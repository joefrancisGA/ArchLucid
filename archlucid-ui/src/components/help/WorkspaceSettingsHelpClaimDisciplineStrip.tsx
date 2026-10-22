import { WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE } from "@/lib/workspace-settings-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/workspace-settings` — header info strip (TB-2092). */
export function WorkspaceSettingsHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-workspace-settings-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{WORKSPACE_SETTINGS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
