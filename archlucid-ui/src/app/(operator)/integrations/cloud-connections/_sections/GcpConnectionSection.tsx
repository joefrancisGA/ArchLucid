"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { configureGcpTier2Connection, disconnectGcpTier2Connection } from "@/lib/api/gcp-cloud-connections-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { GCP_CONNECTION_DISCONNECT_FAILED_ERROR } from "@/lib/gcp-cloud-connection-copy";
import { formatGcpConnectionTimestamp, gcpConnectionStatusBadgeClass } from "@/lib/gcp-connection-present";

import {
  GcpConnectionDisconnectDialog,
  type GcpConnectionDisconnectTarget,
} from "./GcpConnectionDisconnectDialog";
import { useGcpConnectionData } from "./GcpConnectionDataContext";

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
  const [projectId, setProjectId] = useState("");
  const [workloadIdentityPoolProvider, setWorkloadIdentityPoolProvider] = useState("");
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<GcpConnectionDisconnectTarget | null>(null);

  const handleConnect = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    setFormError(null);
    setActionMessage(null);

    const trimmedProjectId = projectId.trim();
    const trimmedProvider = workloadIdentityPoolProvider.trim();
    const trimmedServiceAccount = serviceAccountEmail.trim();

    if (trimmedProjectId.length === 0) {
      setFormError("GCP project ID is required.");

      return;
    }

    if (!trimmedProvider.includes("workloadIdentityPools")) {
      setFormError("Workload Identity Pool provider must reference a workload identity pool provider resource.");

      return;
    }

    if (!trimmedServiceAccount.endsWith(".iam.gserviceaccount.com")) {
      setFormError("Service account email must end with .iam.gserviceaccount.com.");

      return;
    }

    setIsSaving(true);

    try {
      await configureGcpTier2Connection({
        projectId: trimmedProjectId,
        workloadIdentityPoolProvider: trimmedProvider,
        serviceAccountEmail: trimmedServiceAccount,
      });
      await refreshConnections();
      setActionMessage("GCP connection saved.");
      setProjectId("");
      setWorkloadIdentityPoolProvider("");
      setServiceAccountEmail("");
    } catch (err) {
      console.error(err);
      setFormError("Could not save the GCP connection. Verify the Workload Identity Federation binding and try again.");
    } finally {
      setIsSaving(false);
    }
  }, [
    canMutate,
    projectId,
    workloadIdentityPoolProvider,
    serviceAccountEmail,
    refreshConnections,
    setActionMessage,
    setFormError,
  ]);

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
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="gcpProjectId">GCP project ID</Label>
          <Input
            id="gcpProjectId"
            data-testid="gcp-project-id"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            placeholder="my-gcp-project"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gcpPoolProvider">Workload Identity Pool provider</Label>
          <Input
            id="gcpPoolProvider"
            data-testid="gcp-pool-provider"
            value={workloadIdentityPoolProvider}
            onChange={(event) => setWorkloadIdentityPoolProvider(event.target.value)}
            placeholder="projects/123/locations/global/workloadIdentityPools/pool/providers/azure-ad"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gcpServiceAccountEmail">Read-only service account email</Label>
          <Input
            id="gcpServiceAccountEmail"
            data-testid="gcp-service-account-email"
            value={serviceAccountEmail}
            onChange={(event) => setServiceAccountEmail(event.target.value)}
            placeholder="archlucid-readonly@my-gcp-project.iam.gserviceaccount.com"
            autoComplete="off"
          />
        </div>
      </div>

      <Button
        type="button"
        data-testid="gcp-connect-submit"
        variant="primary"
        disabled={isSaving || !canMutate}
        title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
        onClick={() => void handleConnect()}
      >
        {isSaving ? "Saving…" : "Save GCP connection"}
      </Button>

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

      {!isLoading && connections.length > 0 ? (
        <div className="space-y-4" data-testid="gcp-connection-list">
          {connections.map((connection) => (
            <div key={connection.connectionId} className="rounded-md border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>Project {connection.projectId}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    gcpConnectionStatusBadgeClass(connection.status),
                  )}
                >
                  {connection.status}
                </span>
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
                  title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                  onClick={() => void triggerRePoll(connection)}
                >
                  {pollingConnectionId === connection.connectionId ? "Polling…" : "Re-poll now"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-testid={`gcp-disconnect-${connection.connectionId}`}
                  disabled={!canMutate || isDisconnecting}
                  title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
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
    return <div data-testid="cloud-connections-available-gcp">{body}</div>;
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
      <CardContent className="space-y-6">{body}</CardContent>
    </Card>
  );
}
