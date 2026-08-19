"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { disconnectAwsTier2Connection } from "@/lib/api/aws-cloud-connections-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AWS_CONNECTION_DISCONNECT_FAILED_ERROR } from "@/lib/aws-cloud-connection-copy";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { awsConnectionStatusTagKind, formatAwsConnectionTimestamp } from "@/lib/aws-connection-present";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";

import {
  AwsConnectionDisconnectDialog,
  type AwsConnectionDisconnectTarget,
} from "./AwsConnectionDisconnectDialog";
import { AwsConnectionWizard } from "./AwsConnectionWizard";
import { useAwsConnectionData } from "./AwsConnectionDataContext";

export function AwsConnectionSection(props: { readonly embedded?: boolean }) {
  const embedded = props.embedded === true;
  const {
    connections,
    isLoading,
    loadError,
    formError,
    actionMessage,
    messageScope,
    pollingConnectionId,
    canMutate,
    refreshConnections,
    setFormError,
    setActionMessage,
    triggerRePoll,
  } = useAwsConnectionData();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<AwsConnectionDisconnectTarget | null>(null);
  const mutationDisabledHintId = "aws-connection-mutate-disabled-hint";
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();

  const hasConnection = !isLoading && connections.length > 0;

  const handleDisconnect = useCallback(
    async (connectionId: string) => {
      if (!canMutate) {
        return;
      }

      setActionMessage(null, "connection");
      setFormError(null, "connection");
      setIsDisconnecting(true);

      try {
        await disconnectAwsTier2Connection(connectionId);
        await refreshConnections();
        setActionMessage("AWS connection removed.", "connection");
        setDisconnectTarget(null);
      } catch (err) {
        console.error(err);
        setFormError(AWS_CONNECTION_DISCONNECT_FAILED_ERROR, "connection");
      } finally {
        setIsDisconnecting(false);
      }
    },
    [canMutate, refreshConnections, setActionMessage, setFormError],
  );

  const ownsMessage = messageScope === "connection";

  // A failed disconnect leaves the dialog open over the page, so its error belongs inside the
  // dialog rather than behind the modal overlay.
  const disconnectDialogError = disconnectTarget !== null && ownsMessage ? formError : null;
  const inlineFormError = ownsMessage && disconnectDialogError === null ? formError : null;
  const inlineActionMessage = ownsMessage ? actionMessage : null;

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

      {inlineActionMessage !== null ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-emerald-700 dark:text-emerald-300")} role="status">
          {inlineActionMessage}
        </p>
      ) : null}

      {isLoading ? <p className={OPERATOR_TYPOGRAPHY.helper}>Loading AWS connections…</p> : null}

      {!isLoading && !hasConnection ? <AwsConnectionWizard /> : null}

      {hasConnection ? (
        <div className="space-y-4" data-testid="aws-connection-list">
          <WhyDisabledCtaHint
            id={mutationDisabledHintId}
            reason={mutationDisabledReason}
            testId={mutationDisabledHintId}
          />
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
              <div className="flex flex-wrap gap-2" data-testid="aws-connection-primary-actions">
                <Button
                  type="button"
                  variant="primary"
                  data-testid={`aws-repoll-${connection.connectionId}`}
                  disabled={pollingConnectionId === connection.connectionId || !canMutate}
                  aria-describedby={!canMutate ? mutationDisabledHintId : undefined}
                  onClick={() => void triggerRePoll(connection, "connection")}
                >
                  {pollingConnectionId === connection.connectionId ? "Polling…" : "Re-poll now"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-testid={`aws-disconnect-${connection.connectionId}`}
                  disabled={!canMutate || isDisconnecting}
                  aria-describedby={!canMutate ? mutationDisabledHintId : undefined}
                  onClick={() =>
                    setDisconnectTarget({
                      connectionId: connection.connectionId,
                      accountId: connection.accountId,
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

      <AwsConnectionDisconnectDialog
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
    return <div className="space-y-4" data-testid="cloud-connections-available-aws">{body}</div>;
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
      <CardContent className="space-y-4">{body}</CardContent>
    </Card>
  );
}
