"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import {
  AwsTier2ConnectionResponse,
  configureAwsTier2Connection,
  disconnectAwsTier2Connection,
  listAwsTier2Connections,
  triggerAwsTier2HostedRun,
} from "@/lib/api/aws-cloud-connections-api";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

/** Maps a raw AWS connection status to the canonical enterprise status vocabulary. */
function statusTagKind(status: string): EnterpriseStatusKind {
  switch (status.toLowerCase()) {
    case "connected":
      return "ready";
    case "polling":
      return "in-progress";
    case "error":
      return "blocked";
    default:
      return "neutral";
  }
}

export function AwsConnectionSection() {
  const [connections, setConnections] = useState<AwsTier2ConnectionResponse[]>([]);
  const [accountId, setAccountId] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [roleArn, setRoleArn] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pollingConnectionId, setPollingConnectionId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const loadStartedRef = useRef(false);

  const refreshConnections = useCallback(async () => {
    const data = await listAwsTier2Connections();
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
        setFormError("Could not load AWS connections. Check your permissions and try again.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [refreshConnections]);

  const handleConnect = useCallback(async () => {
    setFormError(null);
    setActionMessage(null);

    const trimmedAccountId = accountId.trim();
    const trimmedRegion = region.trim();
    const trimmedRoleArn = roleArn.trim();

    if (!/^\d{12}$/.test(trimmedAccountId)) {
      setFormError("AWS account ID must be a 12-digit number.");

      return;
    }

    if (!trimmedRegion) {
      setFormError("AWS region is required.");

      return;
    }

    if (!trimmedRoleArn.startsWith("arn:aws:iam:")) {
      setFormError("Role ARN must start with arn:aws:iam:.");

      return;
    }

    setIsSaving(true);

    try {
      await configureAwsTier2Connection({
        accountId: trimmedAccountId,
        region: trimmedRegion,
        roleArn: trimmedRoleArn,
      });
      await refreshConnections();
      setActionMessage("AWS connection saved.");
      setAccountId("");
      setRoleArn("");
    } catch (err) {
      console.error(err);
      setFormError("Could not save the AWS connection. Verify the role ARN and try again.");
    } finally {
      setIsSaving(false);
    }
  }, [accountId, region, roleArn, refreshConnections]);

  const handleRePoll = useCallback(
    async (connection: AwsTier2ConnectionResponse) => {
      setActionMessage(null);
      setFormError(null);
      setPollingConnectionId(connection.connectionId);

      try {
        const result = await triggerAwsTier2HostedRun({ connectionId: connection.connectionId });
        await refreshConnections();
        setActionMessage(
          `Poll completed (${result.resourceCount} resources ingested as package ${result.packageId}).`,
        );
      } catch (err) {
        console.error(err);
        setFormError("Hosted AWS poll failed. Confirm Tier 2 is enabled and the IAM trust is configured.");
      } finally {
        setPollingConnectionId(null);
      }
    },
    [refreshConnections],
  );

  const handleDisconnect = useCallback(
    async (connectionId: string) => {
      setActionMessage(null);
      setFormError(null);

      try {
        await disconnectAwsTier2Connection(connectionId);
        await refreshConnections();
        setActionMessage("AWS connection removed.");
      } catch (err) {
        console.error(err);
        setFormError("Could not disconnect the AWS connection.");
      }
    },
    [refreshConnections],
  );

  return (
    <Card data-testid="cloud-connections-available-aws">
      <CardHeader>
        <CardTitle>Connect AWS</CardTitle>
        <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
          Use IAM role ARN + OIDC federation (Azure managed identity trust). ArchLucid stores connection metadata
          only; no long-lived access keys are stored.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="awsAccountId">AWS account ID</Label>
            <Input
              id="awsAccountId"
              data-testid="aws-account-id"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              placeholder="123456789012"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="awsRegion">Primary region</Label>
            <Input
              id="awsRegion"
              data-testid="aws-region"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              placeholder="us-east-1"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="awsRoleArn">Read-only IAM role ARN</Label>
            <Input
              id="awsRoleArn"
              data-testid="aws-role-arn"
              value={roleArn}
              onChange={(event) => setRoleArn(event.target.value)}
              placeholder="arn:aws:iam::123456789012:role/ArchLucidReadOnly"
              autoComplete="off"
            />
          </div>
        </div>

        <Button
          type="button"
          data-testid="aws-connect-submit"
          disabled={isSaving}
          onClick={() => void handleConnect()}
        >
          {isSaving ? "Saving…" : "Save AWS connection"}
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

        {isLoading ? <p className={OPERATOR_TYPOGRAPHY.helper}>Loading AWS connections…</p> : null}

        {!isLoading && connections.length > 0 ? (
          <div className="space-y-4" data-testid="aws-connection-list">
            {connections.map((connection) => (
              <div key={connection.connectionId} className="rounded-md border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>
                    Account {connection.accountId}
                  </p>
                  <StatusTag kind={statusTagKind(connection.status)} label={connection.status} />
                </div>
                <dl className={cn("grid grid-cols-2 gap-2", OPERATOR_TYPOGRAPHY.body)}>
                  <dt className="text-muted-foreground">Region</dt>
                  <dd>{connection.region}</dd>
                  <dt className="text-muted-foreground">Role ARN</dt>
                  <dd className="break-all">{connection.roleArn}</dd>
                  <dt className="text-muted-foreground">Last polled</dt>
                  <dd>{formatTimestamp(connection.lastPolledUtc)}</dd>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    data-testid={`aws-repoll-${connection.connectionId}`}
                    disabled={pollingConnectionId === connection.connectionId}
                    onClick={() => void handleRePoll(connection)}
                  >
                    {pollingConnectionId === connection.connectionId ? "Polling…" : "Re-poll now"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    data-testid={`aws-disconnect-${connection.connectionId}`}
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
