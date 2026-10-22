"use client";

import { StatusTag } from "@/components/ui/status-tag";
import { IntegrationZoneRecoveryCard } from "@/components/integrations/IntegrationZoneRecoveryCard";
import {
  AZURE_BOARDS_CONNECTION_STATUS_HEADING,
} from "@/lib/azure-boards-page-copy";
import { resolveAzureBoardsConnectionStatus } from "@/lib/azure-boards-integration-present";
import type { IntegrationZoneRecovery } from "@/lib/integration-zone-recovery";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function statusTagKind(
  status: ReturnType<typeof resolveAzureBoardsConnectionStatus>["status"],
): "ready" | "needs-attention" | "neutral" | "in-progress" {
  if (status === "connected") {
    return "ready";
  }

  if (status === "connection-issue") {
    return "needs-attention";
  }

  if (status === "testing") {
    return "in-progress";
  }

  if (status === "setup-incomplete") {
    return "needs-attention";
  }

  return "neutral";
}

export type AzureBoardsConnectionStatusPanelProps = {
  connectionStatus: ReturnType<typeof resolveAzureBoardsConnectionStatus>;
  integrationZoneRecoveries: readonly IntegrationZoneRecovery[];
};

export function AzureBoardsConnectionStatusPanel({
  connectionStatus,
  integrationZoneRecoveries,
}: AzureBoardsConnectionStatusPanelProps): React.ReactElement {
  return (
    <>
      <section aria-labelledby="azure-boards-status-heading" className="space-y-3" data-testid="azure-boards-connection-status">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="azure-boards-status-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
            {AZURE_BOARDS_CONNECTION_STATUS_HEADING}
          </h2>
          <StatusTag kind={statusTagKind(connectionStatus.status)} label={connectionStatus.label} />
        </div>
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} role="status">
          {connectionStatus.explanation}
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-medium text-al-text-primary">Next step:</span> {connectionStatus.nextAction}
        </p>
      </section>

      {integrationZoneRecoveries.length > 0 ? (
        <div className="space-y-3" data-testid="azure-boards-zone-recoveries">
          {integrationZoneRecoveries.map((recovery) => (
            <IntegrationZoneRecoveryCard key={recovery.zoneId} recovery={recovery} />
          ))}
        </div>
      ) : null}
    </>
  );
}

export { statusTagKind };
