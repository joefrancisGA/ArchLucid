"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import { CloudFirstInventoryCoach } from "@/components/integrations/CloudFirstInventoryCoach";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="aws-connection-recent-activity-panel">
        No collection activity yet for this AWS account.{" "}
        <Link href="#connection-details" className={OPERATOR_LINK.inline}>
          Configure connection details
        </Link>{" "}
        to start scheduled inventory collection.
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="aws-connection-recent-activity-panel">
      <CloudFirstInventoryCoach hasConnection={hasConnection} hasSuccessfulPull={hasSuccessfulPull} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left">
          <thead>
            <tr className={cn(OPERATOR_TYPOGRAPHY.helper, "border-b")}>
              <th className="py-2 pr-4 font-medium">Account</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 font-medium">Last collected</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((connection) => (
              <tr key={connection.connectionId} className="border-b last:border-b-0">
                <td className={cn("py-2 pr-4", OPERATOR_TYPOGRAPHY.body)}>{connection.accountId}</td>
                <td className="py-2 pr-4">
                  <StatusTag kind={awsConnectionStatusTagKind(connection.status)} label={connection.status} />
                </td>
                <td className={cn("py-2", OPERATOR_TYPOGRAPHY.body)}>
                  {formatAwsConnectionTimestamp(connection.lastPolledUtc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
