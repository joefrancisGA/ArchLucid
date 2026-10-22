"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { GCP_CONNECTION_VALIDATE_EMPTY_STATE } from "@/lib/gcp-cloud-connection-copy";
import {
  formatGcpConnectionTimestamp,
  gcpConnectionStatusTagKind,
} from "@/lib/gcp-connection-present";

import { useGcpConnectionData } from "./GcpConnectionDataContext";

const GCP_VALIDATE_MUTATION_DISABLED_HINT_ID = "gcp-connection-validate-mutation-disabled-hint";

export function GcpConnectionValidatePanel(): React.ReactElement {
  const {
    connections,
    isLoading,
    loadError,
    formError,
    actionMessage,
    pollingConnectionId,
    canMutate,
    triggerRePoll,
  } = useGcpConnectionData();

  if (isLoading) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="gcp-connection-validate-panel">
        Loading saved connections…
      </p>
    );
  }

  if (loadError !== null) {
    return (
      <p
        className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")}
        role="alert"
        data-testid="gcp-connection-validate-panel"
      >
        {loadError}
      </p>
    );
  }

  if (connections.length === 0) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="gcp-connection-validate-panel">
        {GCP_CONNECTION_VALIDATE_EMPTY_STATE}
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="gcp-connection-validate-panel">
      <p className={OPERATOR_TYPOGRAPHY.helper}>
        Re-poll now validates Workload Identity Federation access and imports a fresh inventory package.
      </p>
      {connections.map((connection) => (
        <div key={connection.connectionId} className="rounded-md border p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn(OPERATOR_TYPOGRAPHY.body, "font-semibold")}>Project {connection.projectId}</p>
            <StatusTag kind={gcpConnectionStatusTagKind(connection.status)} label={connection.status} />
          </div>
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Last collected {formatGcpConnectionTimestamp(connection.lastPolledUtc)}
          </p>
          <Button
            type="button"
            variant="secondary"
            data-testid={`gcp-validate-repoll-${connection.connectionId}`}
            disabled={pollingConnectionId === connection.connectionId || !canMutate}
            aria-describedby={canMutate ? undefined : GCP_VALIDATE_MUTATION_DISABLED_HINT_ID}
            onClick={() => void triggerRePoll(connection)}
          >
            {pollingConnectionId === connection.connectionId ? "Validating…" : "Re-poll now"}
          </Button>
        </div>
      ))}
      {!canMutate ? (
        <p id={GCP_VALIDATE_MUTATION_DISABLED_HINT_ID} className={OPERATOR_TYPOGRAPHY.helper}>
          {enterpriseMutationControlDisabledTitle}
        </p>
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
