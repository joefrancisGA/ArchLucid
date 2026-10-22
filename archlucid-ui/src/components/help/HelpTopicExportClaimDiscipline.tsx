import { CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE } from "@/lib/caiq-sig-response-help-evidence-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type HelpTopicExportClaimDisciplineProps = {
  readonly claimDiscipline?: string;
};

/** Print-visible export caveat for public help PDF / print flows. */
export function HelpTopicExportClaimDiscipline(
  props: HelpTopicExportClaimDisciplineProps = {},
): React.JSX.Element {
  const claimDiscipline = props.claimDiscipline ?? CAIQ_SIG_RESPONSE_HELP_CLAIM_DISCIPLINE;

  return (
    <p
      className={cn(
        "m-0 max-w-3xl text-al-text-secondary print:text-black hidden print:block",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="help-topic-export-claim-discipline"
    >
      {claimDiscipline}
    </p>
  );
}
