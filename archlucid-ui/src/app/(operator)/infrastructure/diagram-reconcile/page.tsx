import type { Metadata } from "next";

import { DiagramReconcileWorkbenchClient } from "@/app/(operator)/governance/infrastructure/diagram-reconcile/DiagramReconcileWorkbenchClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureDiagramReconcile,
};

/** SecureNow diagram reconciliation workbench — ingest, reconcile, and actionable correspondence rows. */
export default function SecureNowInfrastructureDiagramReconcilePage() {
  return <DiagramReconcileWorkbenchClient />;
}
