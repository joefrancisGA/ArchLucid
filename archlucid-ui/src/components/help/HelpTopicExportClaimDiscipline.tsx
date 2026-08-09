import { CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE } from "@/lib/caiq-sig-response-help-evidence-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Print-visible export caveat for public help PDF / print flows. */
export function HelpTopicExportClaimDiscipline(): React.JSX.Element {
  return (
    <p
      className={cn("m-0 max-w-3xl text-al-text-secondary print:text-black", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="help-topic-export-claim-discipline"
    >
      {CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE}
    </p>
  );
}
