"use client";

import {
  SERVICENOW_CONNECTION_SETTINGS_LEAD,
  SERVICENOW_CONNECTION_SETTINGS_TITLE,
  SERVICENOW_CREDENTIALS_ADMIN_REQUIRED,
  SERVICENOW_FIELD_AUTH_METHOD,
  SERVICENOW_FIELD_CONNECTION_LABEL,
  SERVICENOW_FIELD_CREDENTIAL_STATUS,
  SERVICENOW_FIELD_INSTANCE_URL,
} from "@/lib/servicenow-integration-page-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ServiceNowConnectionSettingsPanelProps = {
  readonly instanceUrl: string;
  readonly authMethod: string;
  readonly credentialStatus: string;
  readonly connectionLabel: string | undefined;
  readonly credentialsReady: boolean;
};

export function ServiceNowConnectionSettingsPanel({
  instanceUrl,
  authMethod,
  credentialStatus,
  connectionLabel,
  credentialsReady,
}: ServiceNowConnectionSettingsPanelProps): React.ReactElement {
  return (
    <section
      aria-labelledby="servicenow-connection-settings-heading"
      className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
      data-testid="servicenow-connection-settings"
    >
      <div>
        <h2 id="servicenow-connection-settings-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {SERVICENOW_CONNECTION_SETTINGS_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SERVICENOW_CONNECTION_SETTINGS_LEAD}
        </p>
      </div>

      <dl className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <div>
          <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_FIELD_INSTANCE_URL}</dt>
          <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="servicenow-instance-url">
            {instanceUrl}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_FIELD_AUTH_METHOD}</dt>
          <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="servicenow-auth-method">
            {authMethod}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_FIELD_CREDENTIAL_STATUS}</dt>
          <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="servicenow-credential-status">
            {credentialStatus}
          </dd>
        </div>
        {connectionLabel ? (
          <div>
            <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{SERVICENOW_FIELD_CONNECTION_LABEL}</dt>
            <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{connectionLabel}</dd>
          </div>
        ) : null}
      </dl>

      {!credentialsReady ? (
        <p className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)} role="status">
          {SERVICENOW_CREDENTIALS_ADMIN_REQUIRED}
        </p>
      ) : null}
    </section>
  );
}
