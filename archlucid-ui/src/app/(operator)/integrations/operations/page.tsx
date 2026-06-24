import type { Metadata } from "next";

import { ConnectorOperationsDashboard } from "@/components/integrations/ConnectorOperationsDashboard";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";

export const metadata: Metadata = {
  title: "Connector operations",
};

export default function IntegrationsOperationsPage() {
  return (
    <div className="w-full max-w-[1200px] space-y-6 px-1 py-4 sm:px-0">
      <OperatorPageHeader
        title="Connector operations"
        subtitle="Check readiness for notifications, ticketing, publishing, and integration events. These connectors are optional for first review generation."
      />
      <LayerHeader
        pageKey="integrations-operations"
        density="compact"
        collapsibleGuidance="About integration readiness"
      />
      <ConnectorOperationsDashboard />
    </div>
  );
}
