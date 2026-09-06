import type { Metadata } from "next";

import { InfrastructureWorkbenchStub } from "@/app/(operator)/governance/infrastructure/_sections/InfrastructureWorkbenchStub";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureAsk,
};

/** IE-UX-00 stub — Infrastructure Ask ships in IE-UX-04. */
export default function InfrastructureAskPage() {
  return (
    <InfrastructureWorkbenchStub
      pageKey="infrastructure-ask"
      shippedInBatch="IE-UX-04"
      lead="Ask grounded questions about inventory evidence with citation-backed answers and honest InsufficientEvidence states."
    />
  );
}
