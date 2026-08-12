"use client";

import { cn } from "@/lib/utils";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AZURE_CONNECTION_VALIDATE_EMPTY_STATE } from "@/lib/azure-cloud-connection-copy";
import {
  formatAzureConnectionTimestamp,
  formatAzureSubscriptionSummary,
} from "@/lib/azure-connection-present";

import { useAzureConnectionData } from "./AzureConnectionDataContext";

export function AzureConnectionValidatePanel(): React.ReactElement {
  const {
    connections,
    isLoading,
    loadError,
    formError,
    actionMessage,
  } = useAzureConnectionData();

  if (isLoading) {
    return (
      <div
        className="space-y-2"
        data-testid="azure-connection-validate-panel"
        aria-busy="true"
        aria-live="polite"
      >
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (loadError !== null) {
    return (
      <p
        className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")}
        role="alert"
        data-testid="azure-connection-validate-panel"
      >
        {loadError}
      </p>
    );
  }

  if (connections.length === 0) {
    return (
      <EnterpriseCompactEmptyState
        title="No saved connection"
        description={AZURE_CONNECTION_VALIDATE_EMPTY_STATE}
        testId="azure-connection-validate-panel"
      />
    );
  }

  return (
    <div className="space-y-4" data-testid="azure-connection-validate-panel">
      <p className={OPERATOR_TYPOGRAPHY.helper}>
        Validate connection in Connection details confirms federated credentials and imports a fresh inventory
        package for the first subscription ID.
      </p>
      {connections.map((connection) => (
        <div key={connection.connectionId} className="rounded-md border p-4 space-y-2">
          <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>
            Tenant {connection.tenantId}
          </p>
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Subscription {formatAzureSubscriptionSummary(connection.subscriptionIds)}
          </p>
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Last updated {formatAzureConnectionTimestamp(connection.updatedUtc)}
          </p>
        </div>
      ))}
      {formError ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
          {formError}
        </p>
      ) : null}
      {actionMessage ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-emerald-700 dark:text-emerald-300")} role="status">
          {actionMessage}
        </p>
      ) : null}
    </div>
  );
}
