import type { ReactElement } from "react";

import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

export function RunDetailPreFinalizedEmptyState(): ReactElement {
  return (
    <OperatorEmptyState title="Review not ready yet">
      <p className="m-0">
        This architecture review has not been finalized yet. After the pipeline completes and you finalize, the{" "}
        <InlineGlossaryChip nounId="signed-review-record">{SIGNED_MANIFEST_LABEL.toLowerCase()}</InlineGlossaryChip>,{" "}
        <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip>, and exports will appear here.
      </p>
    </OperatorEmptyState>
  );
}
