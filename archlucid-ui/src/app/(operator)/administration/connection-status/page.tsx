import { ConnectorOperationsDashboard } from "@/components/integrations/ConnectorOperationsDashboard";
import { ConnectionStatusCloudConnectionsVocabularyRail } from "@/components/ConnectionStatusCloudConnectionsVocabularyRail";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function AdministrationConnectionStatusPage() {
  return (
    <div className="w-full max-w-[1120px] space-y-6 px-1 py-4 sm:px-0">
      <OperatorPageHeader
        title={OPERATOR_NAV_LINK_LABELS.integrationReadiness}
        subtitle="See which integrations are ready, recommended, or optional for this workspace — and what to configure first."
        actions={<PageContextualHelpButton />}
      />
      <ConnectionStatusCloudConnectionsVocabularyRail currentSurfaceId="connection-status" />
      <p className={cn("m-0 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Connection status shows which notification, ticketing, publishing, and delivery integrations are configured
        for this workspace.
      </p>
      <ConnectorOperationsDashboard />
    </div>
  );
}
