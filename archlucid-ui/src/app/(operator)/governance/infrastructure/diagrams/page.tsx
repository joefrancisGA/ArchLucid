import type { Metadata } from "next";

import { InfrastructureWorkbenchStub } from "@/app/(operator)/governance/infrastructure/_sections/InfrastructureWorkbenchStub";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureDiagrams,
};

/** IE-UX-00 stub — diagram viewer ships in IE-UX-02. */
export default function InfrastructureDiagramsPage() {
  return (
    <InfrastructureWorkbenchStub
      pageKey="infrastructure-diagrams"
      shippedInBatch="IE-UX-02"
      lead="Render large inventory diagrams with partitioned fallbacks, drill-down, and server PNG export."
    />
  );
}
