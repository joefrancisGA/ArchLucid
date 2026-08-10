"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AZURE_CONNECTION_VALIDATE_EMPTY_STATE,
  AZURE_CONNECTION_VALIDATION_ADMIN_REQUIRED,
  AZURE_CONNECTION_VALIDATION_BUTTON_LABEL,
} from "@/lib/azure-cloud-connection-copy";
import {
  formatAzureConnectionTimestamp,
  formatAzureSubscriptionSummary,
} from "@/lib/azure-connection-present";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";

import { useAzureConnectionData } from "./AzureConnectionDataContext";

export function AzureConnectionValidatePanel(): React.ReactElement {
  const {
    connections,
    isLoading,
    loadError,
    formError,
    actionMessage,
    validatingConnectionId,
    canRunValidation,
    triggerValidate,
  } = useAzureConnectionData();

  if (isLoading) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="azure-connection-validate-panel">
        Loading saved connections…
      </p>
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
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="azure-connection-validate-panel">
        {AZURE_CONNECTION_VALIDATE_EMPTY_STATE}
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="azure-connection-validate-panel">
      <p className={OPERATOR_TYPOGRAPHY.helper}>
        Validate connection confirms federated credentials and imports a fresh inventory package for the first
        subscription ID.
      </p>
      {connections.map((connection) => (
        <div key={connection.connectionId} className="rounded-md border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>
              Tenant {connection.tenantId}
            </p>
          </div>
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Subscription {formatAzureSubscriptionSummary(connection.subscriptionIds)}
          </p>
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Last updated {formatAzureConnectionTimestamp(connection.updatedUtc)}
          </p>
          <Button
            type="button"
            variant="secondary"
            data-testid={`azure-validate-${connection.connectionId}`}
            disabled={validatingConnectionId === connection.connectionId || !canRunValidation}
            title={canRunValidation ? undefined : AZURE_CONNECTION_VALIDATION_ADMIN_REQUIRED}
            onClick={() => void triggerValidate(connection)}
          >
            {validatingConnectionId === connection.connectionId
              ? "Validating…"
              : AZURE_CONNECTION_VALIDATION_BUTTON_LABEL}
          </Button>
        </div>
      ))}
      {!canRunValidation ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>{AZURE_CONNECTION_VALIDATION_ADMIN_REQUIRED}</p>
      ) : null}
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
