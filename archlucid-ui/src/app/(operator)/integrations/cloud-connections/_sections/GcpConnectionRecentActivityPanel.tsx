"use client";

import { cn } from "@/lib/utils";

import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cloudConnectionIndicatesSuccessfulPull } from "@/lib/cloud-first-inventory-coach";
import { formatGcpConnectionTimestamp, gcpConnectionStatusBadgeClass } from "@/lib/gcp-connection-present";

import { useGcpConnectionData } from "./GcpConnectionDataContext";

export function GcpConnectionRecentActivityPanel(): React.ReactElement {
  const { connections, isLoading, loadError } = useGcpConnectionData();

  if (isLoading) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="gcp-connection-recent-activity-panel">
        Loading collection activity...
      </p>
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
        <CloudFirstInventoryCoach hasConnection={false} hasSuccessfulPull={false} />
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="gcp-connection-recent-activity-panel">
      <CloudFirstInventoryCoach hasConnection={hasConnection} hasSuccessfulPull={hasSuccessfulPull} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left">
          <thead>
            <tr className={cn(OPERATOR_TYPOGRAPHY.helper, "border-b")}>
              <th className="py-2 pr-4 font-medium">Project</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Last collected</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((connection) => (
              <tr key={connection.connectionId} className="border-b last:border-b-0">
                <td className={cn("py-2 pr-4", OPERATOR_TYPOGRAPHY.body)}>{connection.projectId}</td>
                <td className="py-2 pr-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      gcpConnectionStatusBadgeClass(connection.status),
                    )}
                  >
                    {connection.status}
                  </span>
                </td>
                <td className={cn("py-2", OPERATOR_TYPOGRAPHY.body)}>
                  {formatGcpConnectionTimestamp(connection.lastPolledUtc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
