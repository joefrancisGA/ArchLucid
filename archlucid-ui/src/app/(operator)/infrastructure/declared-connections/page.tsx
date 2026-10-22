import type { Metadata } from "next";

import { DeclaredConnectionsWorkbenchClient } from "@/app/(operator)/governance/infrastructure/declared-connections/DeclaredConnectionsWorkbenchClient";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.infrastructureDeclaredConnections,
};

/** SecureNow declared connections workbench — human ConnectsTo or DependsOn edges with expiry. */
export default function SecureNowInfrastructureDeclaredConnectionsPage() {
  return <DeclaredConnectionsWorkbenchClient />;
}
