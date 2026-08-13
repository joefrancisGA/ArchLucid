"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { disconnectGcpTier2Connection } from "@/lib/api/gcp-cloud-connections-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { GCP_CONNECTION_DISCONNECT_FAILED_ERROR } from "@/lib/gcp-cloud-connection-copy";
import {
  formatGcpConnectionTimestamp,
  gcpConnectionStatusTagKind,
} from "@/lib/gcp-connection-present";

import {
  GcpConnectionDisconnectDialog,
  type GcpConnectionDisconnectTarget,
} from "./GcpConnectionDisconnectDialog";
import { useGcpConnectionData } from "./GcpConnectionDataContext";
import { GcpConnectionWizard } from "./GcpConnectionWizard";

const GCP_MUTATION_DISABLED_HINT_ID = "gcp-connection-mutation-disabled-hint";

export function GcpConnectionSection(props: { readonly embedded?: boolean }) {
  const embedded = props.embedded === true;
  const {
    connections,
    isLoading,
    loadError,
    formError,
    actionMessage,
    pollingConnectionId,
    canMutate,
    refreshConnections,
    setFormError,
    setActionMessage,
    triggerRePoll,
  } = useGcpConnectionData();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<GcpConnectionDisconnectTarget | null>(null);

  const hasConnection = !isLoading && connections.length > 0;

  const handleDisconnect = useCallback(
    async (connectionId: string) => {
      if (!canMutate) {
        return;
      }

      setActionMessage(null);
      setFormError(null);
      setIsDisconnecting(true);

      try {
        await disconnectGcpTier2Connection(connectionId);
        await refreshConnections();
        setActionMessage("GCP connection removed.");
        setDisconnectTarget(null);
      } catch (err) {
        console.error(err);
        setFormError(GCP_CONNECTION_DISCONNECT_FAILED_ERROR);
      } finally {
        setIsDisconnecting(false);
      }
    },
    [canMutate, refreshConnections, setActionMessage, setFormError],
  );

  const disconnectDialogError = disconnectTarget !== null ? formError : null;
  const inlineFormError = disconnectDialogError === null ? formError : null;

  const body = (
    <>
      {loadError !== null ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
          {loadError}
        </p>
      ) : null}

      {inlineFormError !== null ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
          {inlineFormError}
        </p>
      ) : null}

      {actionMessage !== null ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-emerald-700 dark:text-emerald-300")} role="status">
          {actionMessage}
        </p>
      ) : null}

      {isLoading ? <p className={OPERATOR_TYPOGRAPHY.helper}>Loading GCP connections…</p> : null}

      {!isLoading && !hasConnection ? <GcpConnectionWizard /> : null}

      {hasConnection ? (
        <div className="space-y-4" data-testid="gcp-connection-list">
          {connections.map((connection) => (
            <div key={connection.connectionId} className="rounded-md border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>Project {connection.projectId}</p>
                <StatusTag kind={gcpConnectionStatusTagKind(connection.status)} label={connection.status} />
              </div>
              <dl className={cn("grid grid-cols-2 gap-2", OPERATOR_TYPOGRAPHY.body)}>
                <dt className="text-muted-foreground">Pool provider</dt>
                <dd className="break-all">{connection.workloadIdentityPoolProvider}</dd>
                <dt className="text-muted-foreground">Service account</dt>
                <dd className="break-all">{connection.serviceAccountEmail}</dd>
                <dt className="text-muted-foreground">Last collected</dt>
                <dd>{formatGcpConnectionTimestamp(connection.lastPolledUtc)}</dd>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  data-testid={`gcp-repoll-${connection.connectionId}`}
                  disabled={pollingConnectionId === connection.connectionId || !canMutate}
                  aria-describedby={canMutate ? undefined : GCP_MUTATION_DISABLED_HINT_ID}
                  onClick={() => void triggerRePoll(connection)}
                >
                  {pollingConnectionId === connection.connectionId ? "Polling…" : "Re-poll now"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-testid={`gcp-disconnect-${connection.connectionId}`}
                  disabled={!canMutate || isDisconnecting}
                  aria-describedby={canMutate ? undefined : GCP_MUTATION_DISABLED_HINT_ID}
                  onClick={() =>
                    setDisconnectTarget({
                      connectionId: connection.connectionId,
                      projectId: connection.projectId,
                    })
                  }
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ))}
          {!canMutate ? (
            <p id={GCP_MUTATION_DISABLED_HINT_ID} className={OPERATOR_TYPOGRAPHY.helper}>
              {enterpriseMutationControlDisabledTitle}
            </p>
          ) : null}
        </div>
      ) : null}

      <GcpConnectionDisconnectDialog
        target={disconnectTarget}
        busy={isDisconnecting}
        errorMessage={disconnectDialogError}
        onCancel={() => setDisconnectTarget(null)}
        onConfirm={() => {
          if (disconnectTarget === null) {
            return;
          }

          void handleDisconnect(disconnectTarget.connectionId);
        }}
      />
    </>
  );

  if (embedded) {
    return <div className="space-y-4" data-testid="cloud-connections-available-gcp">{body}</div>;
  }

  return (
    <Card data-testid="cloud-connections-available-gcp">
      <CardHeader>
        <CardTitle>Connect GCP</CardTitle>
        <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
          Use Workload Identity Federation to impersonate a read-only service account. ArchLucid stores connection
          metadata only; no service-account JSON keys are stored.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">{body}</CardContent>
    </Card>
  );
}
