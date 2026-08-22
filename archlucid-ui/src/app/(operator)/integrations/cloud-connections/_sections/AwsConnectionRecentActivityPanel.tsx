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
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AWS_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE } from "@/lib/aws-cloud-connection-copy";
import { CLOUD_CONNECTIONS_RECENT_ACTIVITY_EMPTY_TITLE } from "@/lib/cloud-connections-copy";
import { cloudConnectionIndicatesSuccessfulPull } from "@/lib/cloud-first-inventory-coach";
import { awsConnectionStatusTagKind, formatAwsConnectionTimestamp } from "@/lib/aws-connection-present";

import { useAwsConnectionData } from "./AwsConnectionDataContext";

export function AwsConnectionRecentActivityPanel(): React.ReactElement {
  const { connections, isLoading, loadError } = useAwsConnectionData();

  if (isLoading) {
    return (
      <div
        className="space-y-2"
        data-testid="aws-connection-recent-activity-panel"
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
        data-testid="aws-connection-recent-activity-panel"
      >
        {loadError}
      </p>
    );
  }

  const hasConnection = connections.length > 0;
  const hasSuccessfulPull = connections.some((connection) =>
    cloudConnectionIndicatesSuccessfulPull(connection),
  );

  if (!hasConnection) {
    return (
      <div className="space-y-3" data-testid="aws-connection-recent-activity-panel">
        <CloudFirstInventoryCoach
          hasConnection={false}
          hasSuccessfulPull={false}
          recommendedProviderId="aws"
        />
        <EnterpriseCompactEmptyState
          title={CLOUD_CONNECTIONS_RECENT_ACTIVITY_EMPTY_TITLE}
          description={AWS_CONNECTION_RECENT_ACTIVITY_EMPTY_STATE}
          testId="aws-connection-recent-activity-empty"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="aws-connection-recent-activity-panel">
      <CloudFirstInventoryCoach hasConnection={hasConnection} hasSuccessfulPull={hasSuccessfulPull} />
      <EnterpriseTable ariaLabel="AWS connection collection activity" className={OPERATOR_TYPOGRAPHY.body}>
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Account</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Last collected</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {connections.map((connection) => (
            <EnterpriseTableRow key={connection.connectionId}>
              <EnterpriseTableCell>{connection.accountId}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag kind={awsConnectionStatusTagKind(connection.status)} label={connection.status} />
              </EnterpriseTableCell>
              <EnterpriseTableCell>{formatAwsConnectionTimestamp(connection.lastPolledUtc)}</EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
