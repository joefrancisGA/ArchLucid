"use client";

import { cn } from "@/lib/utils";

import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
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
import { cloudConnectionIndicatesSuccessfulPull } from "@/lib/cloud-first-inventory-coach";
import { awsConnectionStatusTagKind, formatAwsConnectionTimestamp } from "@/lib/aws-connection-present";

import { useAwsConnectionData } from "./AwsConnectionDataContext";

export function AwsConnectionRecentActivityPanel(): React.ReactElement {
  const { connections, isLoading, loadError } = useAwsConnectionData();

  if (isLoading) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="aws-connection-recent-activity-panel">
        Loading collection activity...
      </p>
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
          emptyPhasePrimaryCtaHref="#connection-details"
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
