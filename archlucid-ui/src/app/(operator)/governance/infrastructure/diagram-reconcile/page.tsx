import type { Metadata } from "next";

import { DiagramReconcileWorkbenchClient } from "@/app/(operator)/governance/infrastructure/diagram-reconcile/DiagramReconcileWorkbenchClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureDiagramReconcile,
};

/** IE-UX-03 diagram reconciliation workbench — ingest, reconcile, and actionable correspondence rows. */
export default function InfrastructureDiagramReconcilePage() {
  return <DiagramReconcileWorkbenchClient />;
}
