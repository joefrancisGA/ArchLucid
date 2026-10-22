import { PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE } from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/prior-manifest-retrieval` — header info strip (TB-2092). */
export function PriorManifestRetrievalHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-prior-manifest-retrieval-claim-discipline-strip"
    >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
