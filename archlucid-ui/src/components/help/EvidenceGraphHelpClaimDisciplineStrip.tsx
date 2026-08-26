import {
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/evidence-graph-help-evidence-copy";
import { EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID } from "@/lib/evidence-graph-help-guide-content";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Claim-discipline orientation for `/help/evidence-graph`. */
export function EvidenceGraphHelpClaimDisciplineStrip(): React.JSX.Element {
  return (
    <aside
      className={cn(DESIGN_TOKENS.callout.info, "p-3")}
      data-testid="help-evidence-graph-claim-discipline-strip"
      aria-labelledby={EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID}
    >
      <h2
        id={EVIDENCE_GRAPH_HELP_CLAIM_HEADING_ID}
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE_HEADING}
      </h2>
      <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{EVIDENCE_GRAPH_HELP_CLAIM_DISCIPLINE}</p>
    </aside>
  );
}
