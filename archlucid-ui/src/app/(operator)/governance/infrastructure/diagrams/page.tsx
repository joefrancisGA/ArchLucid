import type { Metadata } from "next";

import { DiagramsWorkbenchClient } from "@/app/(operator)/governance/infrastructure/diagrams/DiagramsWorkbenchClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureDiagrams,
};

/** IE-UX-02 inventory diagrams workbench — partitioned Mermaid views and server PNG export. */
export default function InfrastructureDiagramsPage() {
  return <DiagramsWorkbenchClient />;
}
