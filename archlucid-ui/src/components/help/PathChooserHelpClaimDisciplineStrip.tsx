import {
  PATH_CHOOSER_HELP_CLAIM_DISCIPLINE,
} from "@/lib/path-chooser-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/choose-your-next-step`. */
export function PathChooserHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-path-chooser-claim-discipline"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{PATH_CHOOSER_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
