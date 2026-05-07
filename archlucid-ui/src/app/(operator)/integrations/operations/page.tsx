import type { Metadata } from "next";

import { ConnectorOperationsDashboard } from "@/components/integrations/ConnectorOperationsDashboard";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";

export const metadata: Metadata = {
  title: "Connector operations",
};

export default function IntegrationsOperationsPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-1 py-4 sm:px-0">
      <OperatorPageHeader title="Connector operations" subtitle="Readiness across Teams, Slack, ITSM, Confluence, digests, and Service Bus (no secrets)." />
      <LayerHeader pageKey="integrations-operations" />
      <ConnectorOperationsDashboard />
    </main>
  );
}
