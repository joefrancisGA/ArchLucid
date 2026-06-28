import type { Metadata } from "next";

import { ConnectorOperationsDashboard } from "@/components/integrations/ConnectorOperationsDashboard";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";

export const metadata: Metadata = {
  title: "Integration readiness",
};

export default function IntegrationsOperationsPage() {
  return (
    <div className="w-full max-w-[1200px] space-y-6 px-1 py-4 sm:px-0">
      <OperatorPageHeader
        title="Integration readiness"
        subtitle="Check readiness for Jira, ServiceNow, Microsoft Teams, Slack, Azure, webhooks, publishing, and integration events. Open a product page below to configure one integration at a time."
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
