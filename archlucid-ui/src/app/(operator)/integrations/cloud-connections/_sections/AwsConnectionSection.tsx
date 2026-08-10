"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { configureAwsTier2Connection, disconnectAwsTier2Connection } from "@/lib/api/aws-cloud-connections-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { awsConnectionStatusTagKind, formatAwsConnectionTimestamp } from "@/lib/aws-connection-present";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";

import { useAwsConnectionData } from "./AwsConnectionDataContext";

export function AwsConnectionSection(props: { readonly embedded?: boolean }) {
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
  } = useAwsConnectionData();
  const [accountId, setAccountId] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [roleArn, setRoleArn] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleConnect = useCallback(async () => {
    if (!canMutate) {
      return;
    }

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
  }, [accountId, canMutate, region, roleArn, refreshConnections, setActionMessage, setFormError]);

  const handleDisconnect = useCallback(
    async (connectionId: string) => {
      if (!canMutate) {
        return;
      }

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
    [canMutate, refreshConnections, setActionMessage, setFormError],
  );

  const body = (
    <>
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
        variant="primary"
        disabled={isSaving || !canMutate}
        title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
        onClick={() => void handleConnect()}
      >
        {isSaving ? "Saving…" : "Save AWS connection"}
      </Button>

      {loadError !== null ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">
          {loadError}
        </p>
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

      {isLoading ? <p className={OPERATOR_TYPOGRAPHY.helper}>Loading AWS connections…</p> : null}

      {!isLoading && connections.length > 0 ? (
        <div className="space-y-4" data-testid="aws-connection-list">
          {connections.map((connection) => (
            <div key={connection.connectionId} className="rounded-md border p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>
                  Account {connection.accountId}
                </p>
                <StatusTag kind={awsConnectionStatusTagKind(connection.status)} label={connection.status} />
              </div>
              <dl className={cn("grid grid-cols-2 gap-2", OPERATOR_TYPOGRAPHY.body)}>
                <dt className="text-muted-foreground">Region</dt>
                <dd>{connection.region}</dd>
                <dt className="text-muted-foreground">Role ARN</dt>
                <dd className="break-all">{connection.roleArn}</dd>
                <dt className="text-muted-foreground">Last collected</dt>
                <dd>{formatAwsConnectionTimestamp(connection.lastPolledUtc)}</dd>
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  data-testid={`aws-repoll-${connection.connectionId}`}
                  disabled={pollingConnectionId === connection.connectionId || !canMutate}
                  title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                  onClick={() => void triggerRePoll(connection)}
                >
                  {pollingConnectionId === connection.connectionId ? "Polling…" : "Re-poll now"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-testid={`aws-disconnect-${connection.connectionId}`}
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
    </>
  );

  if (embedded) {
    return <div data-testid="cloud-connections-available-aws">{body}</div>;
  }

  return (
    <Card data-testid="cloud-connections-available-aws">
      <CardHeader>
        <CardTitle>Connect AWS</CardTitle>
        <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")}>
          Use IAM role ARN + OIDC federation for read-only inventory collection. ArchLucid stores connection metadata
          only; no long-lived access keys are stored.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">{body}</CardContent>
    </Card>
  );
}
