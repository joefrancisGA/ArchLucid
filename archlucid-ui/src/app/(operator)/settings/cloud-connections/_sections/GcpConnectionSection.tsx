"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  GcpTier2ConnectionResponse,
  configureGcpTier2Connection,
  disconnectGcpTier2Connection,
  listGcpTier2Connections,
  triggerGcpTier2HostedRun,
} from "@/lib/api/gcp-cloud-connections-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { useOperateCapability } from "@/hooks/use-operate-capability";

function formatTimestamp(value: string | null): string {
  if (!value) {
    return "Never";
  }

  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleString();
}

function statusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "connected":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100";
    case "polling":
      return "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100";
    case "error":
      return "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100";
    default:
      return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100";
  }
}

export function GcpConnectionSection() {
  const canMutate = useOperateCapability();
  const [connections, setConnections] = useState<GcpTier2ConnectionResponse[]>([]);
  const [projectId, setProjectId] = useState("");
  const [workloadIdentityPoolProvider, setWorkloadIdentityPoolProvider] = useState("");
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pollingConnectionId, setPollingConnectionId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const loadStartedRef = useRef(false);

  const refreshConnections = useCallback(async () => {
    const data = await listGcpTier2Connections();
    setConnections(data);
  }, []);

  useEffect(() => {
    if (loadStartedRef.current) {
      return;
    }

    loadStartedRef.current = true;

    async function load() {
      try {
        await refreshConnections();
      } catch (err) {
        console.error(err);
        setFormError("Could not load GCP connections. Check your permissions and try again.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [refreshConnections]);

  const handleConnect = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    setFormError(null);
    setActionMessage(null);

    const trimmedProjectId = projectId.trim();
    const trimmedProvider = workloadIdentityPoolProvider.trim();
    const trimmedServiceAccount = serviceAccountEmail.trim();

    if (!trimmedProjectId) {
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
  }, [canMutate, projectId, workloadIdentityPoolProvider, serviceAccountEmail, refreshConnections]);

  const handleRePoll = useCallback(
    async (connection: GcpTier2ConnectionResponse) => {
      if (!canMutate) {
        return;
      }

      setActionMessage(null);
      setFormError(null);
      setPollingConnectionId(connection.connectionId);

      try {
        const result = await triggerGcpTier2HostedRun({ connectionId: connection.connectionId });
        await refreshConnections();
        setActionMessage(
          `Poll completed (${result.resourceCount} resources ingested as package ${result.packageId}).`,
        );
      } catch (err) {
        console.error(err);
        setFormError("Hosted GCP poll failed. Confirm Tier 2 is enabled and Workload Identity Federation is configured.");
      } finally {
        setPollingConnectionId(null);
      }
    },
    [canMutate, refreshConnections],
  );

  const handleDisconnect = useCallback(
    async (connectionId: string) => {
      if (!canMutate) {
        return;
      }

      setActionMessage(null);
      setFormError(null);

      try {
        await disconnectGcpTier2Connection(connectionId);
        await refreshConnections();
        setActionMessage("GCP connection removed.");
      } catch (err) {
        console.error(err);
        setFormError("Could not disconnect the GCP connection.");
      }
    },
    [canMutate, refreshConnections],
  );

  return (
    <Card data-testid="cloud-connections-available-gcp">
      <CardHeader>
        <CardTitle>Connect GCP</CardTitle>
        <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
          Use Workload Identity Federation (Azure managed identity trust) to impersonate a read-only service account.
          ArchLucid stores connection metadata only; no service-account JSON keys are stored.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
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
          disabled={isSaving || !canMutate}
          title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
          onClick={() => void handleConnect()}
        >
          {isSaving ? "Saving…" : "Save GCP connection"}
        </Button>

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

        {isLoading ? <p className={OPERATOR_TYPOGRAPHY.helper}>Loading GCP connections…</p> : null}

        {!isLoading && connections.length > 0 ? (
          <div className="space-y-4" data-testid="gcp-connection-list">
            {connections.map((connection) => (
              <div key={connection.connectionId} className="rounded-md border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>
                    Project {connection.projectId}
                  </p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      statusBadgeClass(connection.status),
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
                  <dt className="text-muted-foreground">Last polled</dt>
                  <dd>{formatTimestamp(connection.lastPolledUtc)}</dd>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    data-testid={`gcp-repoll-${connection.connectionId}`}
                    disabled={pollingConnectionId === connection.connectionId || !canMutate}
                    title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                    onClick={() => void handleRePoll(connection)}
                  >
                    {pollingConnectionId === connection.connectionId ? "Polling…" : "Re-poll now"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    data-testid={`gcp-disconnect-${connection.connectionId}`}
                    disabled={!canMutate}
                    title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                    onClick={() => void handleDisconnect(connection.connectionId)}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
