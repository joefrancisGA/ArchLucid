"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { Tier2ConnectionResponse } from "@/lib/api/cloud-connections-api";
import {
  AZURE_CONNECTION_CONNECTED_SUMMARY_LEAD,
  AZURE_CONNECTION_UPDATE_BUTTON_LABEL,
  AZURE_CONNECTION_VALIDATION_ADMIN_REQUIRED,
  AZURE_CONNECTION_VALIDATION_BUTTON_LABEL,
} from "@/lib/azure-cloud-connection-copy";
import {
  formatAzureConnectionTimestamp,
  formatAzureSubscriptionSummary,
} from "@/lib/azure-connection-present";
import { cn } from "@/lib/utils";

import { useAzureConnectionData } from "./AzureConnectionDataContext";
import { Tier2ConnectionWizard } from "./Tier2ConnectionWizard";

type Props = {
  readonly connection: Tier2ConnectionResponse;
  readonly onUpdate: () => void;
};

export function AzureConnectedConnectionSummary(props: Props): React.ReactElement {
  const { connection, onUpdate } = props;
  const {
    formError,
    actionMessage,
    validatingConnectionId,
    canRunValidation,
    triggerValidate,
  } = useAzureConnectionData();

  return (
    <div className="space-y-4" data-testid="azure-connected-connection-summary">
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{AZURE_CONNECTION_CONNECTED_SUMMARY_LEAD}</p>

      <div className="rounded-md border p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>Tenant {connection.tenantId}</p>
          <StatusTag kind="ready" label="Connected" />
        </div>
        <dl className={cn("grid grid-cols-2 gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <dt className="text-muted-foreground">Client ID</dt>
          <dd className="break-all">{connection.clientId}</dd>
          <dt className="text-muted-foreground">Subscriptions</dt>
          <dd>{formatAzureSubscriptionSummary(connection.subscriptionIds)}</dd>
          <dt className="text-muted-foreground">Last updated</dt>
          <dd>{formatAzureConnectionTimestamp(connection.updatedUtc)}</dd>
        </dl>

        <div className="flex flex-wrap gap-2" data-testid="azure-connection-primary-actions">
          <Button
            type="button"
            variant="primary"
            data-testid={`azure-revalidate-${connection.connectionId}`}
            disabled={validatingConnectionId === connection.connectionId || !canRunValidation}
            aria-describedby={canRunValidation ? undefined : "azure-revalidate-disabled-hint"}
            onClick={() => void triggerValidate(connection)}
          >
            {validatingConnectionId === connection.connectionId
              ? "Validating…"
              : AZURE_CONNECTION_VALIDATION_BUTTON_LABEL}
          </Button>
          <Button type="button" variant="outline" data-testid="azure-update-connection" onClick={onUpdate}>
            {AZURE_CONNECTION_UPDATE_BUTTON_LABEL}
          </Button>
        </div>
      </div>

      {!canRunValidation ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>{AZURE_CONNECTION_VALIDATION_ADMIN_REQUIRED}</p>
      ) : null}

      {formError !== null ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
          {formError}
        </p>
      ) : null}

      {actionMessage !== null ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-emerald-700 dark:text-emerald-300")} role="status">
          {actionMessage}
        </p>
      ) : null}
    </div>
  );
}

export function AzureConnectionDetailsPanel(): React.ReactElement {
  const { connections, isLoading, loadError, refreshConnections } = useAzureConnectionData();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return <p className={OPERATOR_TYPOGRAPHY.helper}>Loading Azure connections…</p>;
  }

  if (loadError !== null) {
    return (
      <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
        {loadError}
      </p>
    );
  }

  const primaryConnection = connections[0] ?? null;

  if (primaryConnection !== null && !isEditing) {
    return (
      <AzureConnectedConnectionSummary
        connection={primaryConnection}
        onUpdate={() => setIsEditing(true)}
      />
    );
  }

  return (
    <Tier2ConnectionWizard
      skipSecurityStep
      initialConnection={primaryConnection}
      onCancelEdit={primaryConnection !== null ? () => setIsEditing(false) : undefined}
      onSaved={async () => {
        await refreshConnections();
        setIsEditing(false);
      }}
    />
  );
}
