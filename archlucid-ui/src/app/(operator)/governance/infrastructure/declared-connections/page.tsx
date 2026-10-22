import type { Metadata } from "next";

import { DeclaredConnectionsWorkbenchClient } from "@/app/(operator)/governance/infrastructure/declared-connections/DeclaredConnectionsWorkbenchClient";
import { GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PAGE_TITLE } from "@/lib/governance/governance-infrastructure-copy";

export const metadata: Metadata = {
  title: GOVERNANCE_INFRASTRUCTURE_DECLARED_CONNECTIONS_PAGE_TITLE,
};

/** SecureNow — declare resource connections not visible in Azure inventory alone. */
export default function InfrastructureDeclaredConnectionsPage() {
  return <DeclaredConnectionsWorkbenchClient />;
}
