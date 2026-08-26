import {
  CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_NOT_THIS,
  CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE,
} from "@/lib/caiq-sig-response-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING_ID = "caiq-sig-response-help-claim-heading" as const;

/** Claim-discipline orientation for `/help/caiq-sig-response` — header info strip (TB-2092). */
export function CaiqSigResponseHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-caiq-sig-response-claim-discipline-strip"
      aria-labelledby={CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {CAIQ_SIG_RESPONSE_HELP_CLAIM_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{CAIQ_SIG_RESPONSE_HELP_CLAIM_SCOPE}</p>
      <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
        {CAIQ_SIG_RESPONSE_HELP_CLAIM_NOT_THIS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
