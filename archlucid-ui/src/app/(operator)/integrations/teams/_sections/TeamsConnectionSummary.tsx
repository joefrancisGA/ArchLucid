"use client";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { labelForTeamsNotificationEventType } from "@/lib/teams-integration-notification-catalog";
import {
  TEAMS_INTEGRATION_SECRET_NAME_LABEL,
  teamsIntegrationConnectionStatusLabel,
  type TeamsIntegrationConnectionStatus,
} from "@/lib/teams-integration-page-copy";
import { cn } from "@/lib/utils";
import type { TeamsIncomingWebhookConnectionResponse } from "@/types/teams-incoming-webhook-connection";

type TeamsConnectionSummaryProps = {
  readonly conn: TeamsIncomingWebhookConnectionResponse;
  readonly destinationName: string;
  readonly status: TeamsIntegrationConnectionStatus;
  readonly lastTestMessage: string | null;
};

/** Read-only summary when a Teams connection is already configured. */
export function TeamsConnectionSummary(props: TeamsConnectionSummaryProps): React.ReactElement {
  const enabledLabels = (props.conn.enabledTriggers ?? []).map((eventType) =>
    labelForTeamsNotificationEventType(eventType),
  );

  return (
    <section
      aria-labelledby="teams-connection-summary-heading"
      className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="teams-connection-summary"
    >
      <h2 id="teams-connection-summary-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Connection summary
      </h2>
      <dl className={cn("mt-4 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="font-medium text-al-text-secondary">Destination name</dt>
          <dd className="m-0 mt-1 text-al-text-primary">{props.destinationName}</dd>
        </div>
        <div>
          <dt className="font-medium text-al-text-secondary">Status</dt>
          <dd className="m-0 mt-1 font-medium text-al-text-primary">
            {teamsIntegrationConnectionStatusLabel(props.status)}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-al-text-secondary">{TEAMS_INTEGRATION_SECRET_NAME_LABEL}</dt>
          <dd className="m-0 mt-1 font-mono text-al-text-primary">{props.conn.keyVaultSecretName ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-al-text-secondary">Selected notifications</dt>
          <dd className="m-0 mt-1 text-al-text-primary">
            {enabledLabels.length > 0 ? enabledLabels.join(", ") : "None selected"}
          </dd>
        </div>
        {props.lastTestMessage !== null ? (
          <div className="sm:col-span-2">
            <dt className="font-medium text-al-text-secondary">Last test</dt>
            <dd className="m-0 mt-1 text-al-text-primary">{props.lastTestMessage}</dd>
          </div>
        ) : null}
        {props.conn.isConfigured ? (
          <div className="sm:col-span-2">
            <dt className="font-medium text-al-text-secondary">Last updated</dt>
            <dd className="m-0 mt-1 text-al-text-primary">{new Date(props.conn.updatedUtc).toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
