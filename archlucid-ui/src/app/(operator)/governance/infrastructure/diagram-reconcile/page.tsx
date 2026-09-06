import type { Metadata } from "next";

import { InfrastructureWorkbenchStub } from "@/app/(operator)/governance/infrastructure/_sections/InfrastructureWorkbenchStub";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureDiagramReconcile,
};

/** IE-UX-00 stub — diagram reconciliation workbench ships in IE-UX-03. */
export default function InfrastructureDiagramReconcilePage() {
  return (
    <InfrastructureWorkbenchStub
      pageKey="infrastructure-diagram-reconcile"
      shippedInBatch="IE-UX-03"
      lead="Reconcile uploaded diagrams against inventory snapshots with explainable correspondence rows."
    />
  );
}
