"use client";

import { cn } from "@/lib/utils";

import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AZURE_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE } from "@/lib/azure-cloud-connection-copy";
import { CLOUD_CONNECTIONS_RECENT_ACTIVITY_EMPTY_TITLE } from "@/lib/cloud-connections-copy";
import {
  azureConnectionStatusTagKind,
  formatAzureConnectionTimestamp,
  formatAzureSubscriptionSummary,
} from "@/lib/azure-connection-present";

import { useAzureConnectionData } from "./AzureConnectionDataContext";

export function AzureConnectionRecentActivityPanel(): React.ReactElement {
  const { connections, isLoading, loadError } = useAzureConnectionData();

  if (isLoading) {
    return (
      <div
        className="space-y-2"
        data-testid="azure-connection-recent-activity-panel"
        aria-busy="true"
        aria-live="polite"
      >
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (loadError !== null) {
    return (
      <p
        className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")}
        role="alert"
        data-testid="azure-connection-recent-activity-panel"
      >
        {loadError}
      </p>
    );
  }

  const hasConnection = connections.length > 0;
  const hasSuccessfulPull = connections.some(
    (connection) => (connection.updatedUtc?.trim() ?? "").length > 0,
  );

  if (!hasConnection) {
    return (
      <div className="space-y-3" data-testid="azure-connection-recent-activity-panel">
        <CloudFirstInventoryCoach
          hasConnection={false}
          hasSuccessfulPull={false}
          recommendedProviderId="azure"
        />
        <EnterpriseCompactEmptyState
          title={CLOUD_CONNECTIONS_RECENT_ACTIVITY_EMPTY_TITLE}
          description={AZURE_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE}
          testId="azure-connection-recent-activity-empty"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="azure-connection-recent-activity-panel">
      <CloudFirstInventoryCoach hasConnection={hasConnection} hasSuccessfulPull={hasSuccessfulPull} />
      <EnterpriseTable ariaLabel="Azure connection collection activity">
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>Tenant</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Subscription</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Last updated</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {connections.map((connection) => (
            <EnterpriseTableRow key={connection.connectionId}>
              <EnterpriseTableCell>{connection.tenantId}</EnterpriseTableCell>
              <EnterpriseTableCell>{formatAzureSubscriptionSummary(connection.subscriptionIds)}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag kind={azureConnectionStatusTagKind()} label="Connected" />
              </EnterpriseTableCell>
              <EnterpriseTableCell>{formatAzureConnectionTimestamp(connection.updatedUtc)}</EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
