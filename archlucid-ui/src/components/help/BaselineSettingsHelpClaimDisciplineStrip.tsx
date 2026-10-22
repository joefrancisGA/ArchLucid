import {
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE,
  BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/baseline-settings-help-evidence-copy";
import { BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID } from "@/lib/baseline-settings-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/baseline-settings` — header info strip (TB-2092). */
export function BaselineSettingsHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-baseline-settings-claim-discipline-strip"
      aria-labelledby={BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={BASELINE_SETTINGS_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{BASELINE_SETTINGS_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
