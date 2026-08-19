"use client";

import { cn } from "@/lib/utils";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AWS_CONNECTION_VALIDATE_CONNECTED_LEAD,
  AWS_CONNECTION_VALIDATE_EMPTY_STATE,
} from "@/lib/aws-cloud-connection-copy";
import { awsConnectionStatusTagKind, formatAwsConnectionTimestamp } from "@/lib/aws-connection-present";

import { useAwsConnectionData } from "./AwsConnectionDataContext";

export function AwsConnectionValidatePanel(): React.ReactElement {
  const { connections, isLoading, loadError } = useAwsConnectionData();

  if (isLoading) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="aws-connection-validate-panel">
        Loading saved connections…
      </p>
    );
  }

  if (loadError !== null) {
    return (
      <p
        className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")}
        role="alert"
        data-testid="aws-connection-validate-panel"
      >
        {loadError}
      </p>
    );
  }

  if (connections.length === 0) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="aws-connection-validate-panel">
        {AWS_CONNECTION_VALIDATE_EMPTY_STATE}
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="aws-connection-validate-panel">
      <p className={OPERATOR_TYPOGRAPHY.helper}>{AWS_CONNECTION_VALIDATE_CONNECTED_LEAD}</p>
      {connections.map((connection) => (
        <div key={connection.connectionId} className="rounded-md border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>Account {connection.accountId}</p>
            <StatusTag kind={awsConnectionStatusTagKind(connection.status)} label={connection.status} />
          </div>
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Last collected {formatAwsConnectionTimestamp(connection.lastPolledUtc)}
          </p>
        </div>
      ))}
    </div>
  );
}
