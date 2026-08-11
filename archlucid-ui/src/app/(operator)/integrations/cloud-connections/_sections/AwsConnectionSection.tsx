"use client";

import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { configureAwsTier2Connection, disconnectAwsTier2Connection } from "@/lib/api/aws-cloud-connections-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  AWS_CONNECTION_DISCONNECT_FAILED_ERROR,
  AWS_CONNECTION_SAVE_FAILED_ERROR,
} from "@/lib/aws-cloud-connection-copy";
import { awsConnectionStatusTagKind, formatAwsConnectionTimestamp } from "@/lib/aws-connection-present";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";

import {
  AwsConnectionDisconnectDialog,
  type AwsConnectionDisconnectTarget,
} from "./AwsConnectionDisconnectDialog";
import { useAwsConnectionData } from "./AwsConnectionDataContext";

type AwsConnectionFieldKey = "accountId" | "region" | "roleArn";

type AwsConnectionFieldErrors = {
  readonly accountId: string | null;
  readonly region: string | null;
  readonly roleArn: string | null;
};

function validateAwsConnectionFields(
  accountId: string,
  region: string,
  roleArn: string,
): AwsConnectionFieldErrors {
  const trimmedAccountId = accountId.trim();
  const trimmedRegion = region.trim();
  const trimmedRoleArn = roleArn.trim();

  return {
    accountId: /^\d{12}$/.test(trimmedAccountId) ? null : "AWS account ID must be a 12-digit number.",
    region: trimmedRegion.length > 0 ? null : "AWS region is required.",
    roleArn: trimmedRoleArn.startsWith("arn:aws:iam:") ? null : "Role ARN must start with arn:aws:iam:.",
  };
}

function fieldErrorMessage(
  fieldErrors: AwsConnectionFieldErrors,
  touched: Readonly<Record<AwsConnectionFieldKey, boolean>>,
  field: AwsConnectionFieldKey,
): string | null {
  if (!touched[field]) {
    return null;
  }

  return fieldErrors[field];
}

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
  const [accountId, setAccountId] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [roleArn, setRoleArn] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<AwsConnectionDisconnectTarget | null>(null);
  const [touched, setTouched] = useState<Record<AwsConnectionFieldKey, boolean>>({
    accountId: false,
    region: false,
    roleArn: false,
  });

  const fieldErrors = useMemo(
    () => validateAwsConnectionFields(accountId, region, roleArn),
    [accountId, region, roleArn],
  );

  const canSubmit =
    canMutate &&
    !isSaving &&
    fieldErrors.accountId === null &&
    fieldErrors.region === null &&
    fieldErrors.roleArn === null;

  const markTouched = useCallback((field: AwsConnectionFieldKey) => {
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  const readinessMessage = useMemo(() => {
    if (canSubmit || isSaving) {
      return null;
    }

    if (!canMutate) {
      return enterpriseMutationControlDisabledTitle;
    }

    if (!touched.accountId && !touched.region && !touched.roleArn) {
      return "Enter a 12-digit AWS account ID, primary region, and read-only IAM role ARN to save this connection.";
    }

    const hasVisibleFieldError =
      (touched.accountId && fieldErrors.accountId !== null) ||
      (touched.region && fieldErrors.region !== null) ||
      (touched.roleArn && fieldErrors.roleArn !== null);

    if (hasVisibleFieldError) {
      return null;
    }

    return "Complete the required fields before saving this connection.";
  }, [canMutate, canSubmit, fieldErrors, isSaving, touched]);

  const handleConnect = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    setFormError(null, "connection");
    setActionMessage(null, "connection");

    const trimmedAccountId = accountId.trim();
    const trimmedRegion = region.trim();
    const trimmedRoleArn = roleArn.trim();

    setIsSaving(true);

    try {
      await configureAwsTier2Connection({
        accountId: trimmedAccountId,
        region: trimmedRegion,
        roleArn: trimmedRoleArn,
      });
      await refreshConnections();
      setActionMessage("AWS connection saved.", "connection");
      setAccountId("");
      setRoleArn("");
      setTouched({ accountId: false, region: false, roleArn: false });
    } catch (err) {
      console.error(err);
      setFormError(AWS_CONNECTION_SAVE_FAILED_ERROR, "connection");
    } finally {
      setIsSaving(false);
    }
  }, [accountId, canSubmit, region, roleArn, refreshConnections, setActionMessage, setFormError]);

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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="awsAccountId">AWS account ID</Label>
          <Input
            id="awsAccountId"
            data-testid="aws-account-id"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            onBlur={() => markTouched("accountId")}
            placeholder="123456789012"
            autoComplete="off"
            aria-invalid={fieldErrorMessage(fieldErrors, touched, "accountId") !== null}
            aria-describedby={
              fieldErrorMessage(fieldErrors, touched, "accountId") !== null ? "aws-account-id-error" : undefined
            }
          />
          {fieldErrorMessage(fieldErrors, touched, "accountId") !== null ? (
            <p
              id="aws-account-id-error"
              className={cn(OPERATOR_TYPOGRAPHY.helper, "text-red-600 dark:text-red-400")}
              role="alert"
            >
              {fieldErrorMessage(fieldErrors, touched, "accountId")}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="awsRegion">Primary region</Label>
          <Input
            id="awsRegion"
            data-testid="aws-region"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            onBlur={() => markTouched("region")}
            placeholder="us-east-1"
            autoComplete="off"
            aria-invalid={fieldErrorMessage(fieldErrors, touched, "region") !== null}
            aria-describedby={
              fieldErrorMessage(fieldErrors, touched, "region") !== null ? "aws-region-error" : undefined
            }
          />
          {fieldErrorMessage(fieldErrors, touched, "region") !== null ? (
            <p
              id="aws-region-error"
              className={cn(OPERATOR_TYPOGRAPHY.helper, "text-red-600 dark:text-red-400")}
              role="alert"
            >
              {fieldErrorMessage(fieldErrors, touched, "region")}
            </p>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="awsRoleArn">Read-only IAM role ARN</Label>
          <Input
            id="awsRoleArn"
            data-testid="aws-role-arn"
            value={roleArn}
            onChange={(event) => setRoleArn(event.target.value)}
            onBlur={() => markTouched("roleArn")}
            placeholder="arn:aws:iam::123456789012:role/ArchLucidReadOnly"
            autoComplete="off"
            aria-invalid={fieldErrorMessage(fieldErrors, touched, "roleArn") !== null}
            aria-describedby={
              fieldErrorMessage(fieldErrors, touched, "roleArn") !== null ? "aws-role-arn-error" : undefined
            }
          />
          {fieldErrorMessage(fieldErrors, touched, "roleArn") !== null ? (
            <p
              id="aws-role-arn-error"
              className={cn(OPERATOR_TYPOGRAPHY.helper, "text-red-600 dark:text-red-400")}
              role="alert"
            >
              {fieldErrorMessage(fieldErrors, touched, "roleArn")}
            </p>
          ) : null}
        </div>
      </div>

      {readinessMessage !== null ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary")} data-testid="aws-connect-readiness">
          {readinessMessage}
        </p>
      ) : null}

      <Button
        type="button"
        data-testid="aws-connect-submit"
        variant="primary"
        disabled={!canSubmit}
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
                  onClick={() => void triggerRePoll(connection, "connection")}
                >
                  {pollingConnectionId === connection.connectionId ? "Polling…" : "Re-poll now"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-testid={`aws-disconnect-${connection.connectionId}`}
                  disabled={!canMutate || isDisconnecting}
                  title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
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
