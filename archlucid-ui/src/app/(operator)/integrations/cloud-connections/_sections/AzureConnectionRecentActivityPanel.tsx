"use client";

import { cn } from "@/lib/utils";

import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatAzureConnectionTimestamp,
  formatAzureSubscriptionSummary,
} from "@/lib/azure-connection-present";

import { useAzureConnectionData } from "./AzureConnectionDataContext";

export function AzureConnectionRecentActivityPanel(): React.ReactElement {
  const { connections, isLoading, loadError } = useAzureConnectionData();

  if (isLoading) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="azure-connection-recent-activity-panel">
        Loading collection activity...
      </p>
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
        <CloudFirstInventoryCoach hasConnection={false} hasSuccessfulPull={false} />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="azure-connection-recent-activity-panel">
      <CloudFirstInventoryCoach hasConnection={hasConnection} hasSuccessfulPull={hasSuccessfulPull} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left">
          <thead>
            <tr className={cn(OPERATOR_TYPOGRAPHY.helper, "border-b")}>
              <th className="py-2 pr-4 font-medium">Tenant</th>
              <th className="py-2 pr-4 font-medium">Subscription</th>
              <th className="py-2 font-medium">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((connection) => (
              <tr key={connection.connectionId} className="border-b last:border-b-0">
                <td className={cn("py-2 pr-4", OPERATOR_TYPOGRAPHY.body)}>{connection.tenantId}</td>
                <td className={cn("py-2 pr-4", OPERATOR_TYPOGRAPHY.body)}>
                  {formatAzureSubscriptionSummary(connection.subscriptionIds)}
                </td>
                <td className={cn("py-2", OPERATOR_TYPOGRAPHY.body)}>
                  {formatAzureConnectionTimestamp(connection.updatedUtc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
