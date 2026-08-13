"use client";

import { cn } from "@/lib/utils";

import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
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
import { cloudConnectionIndicatesSuccessfulPull } from "@/lib/cloud-first-inventory-coach";
import {
  formatGcpConnectionTimestamp,
  gcpConnectionStatusTagKind,
} from "@/lib/gcp-connection-present";

import { useGcpConnectionData } from "./GcpConnectionDataContext";

export function GcpConnectionRecentActivityPanel(): React.ReactElement {
  const { connections, isLoading, loadError } = useGcpConnectionData();

  if (isLoading) {
    return (
      <div
        className="space-y-2"
        data-testid="gcp-connection-recent-activity-panel"
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
        data-testid="gcp-connection-recent-activity-panel"
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
      <div className="space-y-3" data-testid="gcp-connection-recent-activity-panel">
        <CloudFirstInventoryCoach
          hasConnection={false}
          hasSuccessfulPull={false}
          recommendedProviderId="gcp"
          emptyPhasePrimaryCtaHref="#connection-details"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="gcp-connection-recent-activity-panel">
      <CloudFirstInventoryCoach hasConnection={hasConnection} hasSuccessfulPull={hasSuccessfulPull} />
      <EnterpriseTable ariaLabel="GCP connection collection activity">
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>Project</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Last collected</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {connections.map((connection) => (
            <EnterpriseTableRow key={connection.connectionId}>
              <EnterpriseTableCell>{connection.projectId}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag
                  kind={gcpConnectionStatusTagKind(connection.status)}
                  label={connection.status}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell>{formatGcpConnectionTimestamp(connection.lastPolledUtc)}</EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}
