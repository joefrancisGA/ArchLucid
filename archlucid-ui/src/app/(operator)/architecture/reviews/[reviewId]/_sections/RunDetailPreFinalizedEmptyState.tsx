import type { ReactElement } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

export function RunDetailPreFinalizedEmptyState(): ReactElement {
  return (
    <EnterpriseCompactEmptyState
      testId="run-detail-pre-finalized-empty-state"
      title="Review not ready yet"
      description={
        <p className="m-0">
          This architecture review has not been finalized yet. After the pipeline completes and you finalize, the{" "}
          <InlineGlossaryChip nounId="sealed-review-record">{SIGNED_MANIFEST_LABEL.toLowerCase()}</InlineGlossaryChip>,{" "}
          <InlineGlossaryChip nounId="evidence-trail">evidence trail</InlineGlossaryChip>, and exports will appear here.
        </p>
      }
    />
  );
}
