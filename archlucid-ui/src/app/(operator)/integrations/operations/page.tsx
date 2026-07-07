import type { Metadata } from "next";

import { ConnectorOperationsDashboard } from "@/components/integrations/ConnectorOperationsDashboard";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";

export const metadata: Metadata = {
  title: "Integration readiness",
};

export default function IntegrationsOperationsPage() {
  return (
    <div className="w-full max-w-[1120px] space-y-6 px-1 py-4 sm:px-0">
      <OperatorPageHeader
        title="Integration readiness"
        subtitle="See which integrations are ready, recommended, or optional for this workspace — and what to configure first."
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
