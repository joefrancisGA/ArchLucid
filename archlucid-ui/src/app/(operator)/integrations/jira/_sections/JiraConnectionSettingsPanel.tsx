"use client";

import {
  JIRA_CONNECTION_SETTINGS_LEAD,
  JIRA_CONNECTION_SETTINGS_TITLE,
  JIRA_FIELD_AUTH_METHOD,
  JIRA_FIELD_CONNECTION_LABEL,
  JIRA_FIELD_CREDENTIAL_STATUS,
  JIRA_FIELD_SITE_URL,
} from "@/lib/jira-integration-page-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type JiraConnectionSettingsPanelProps = {
  readonly siteUrl: string;
  readonly authMethod: string;
  readonly credentialStatus: string;
  readonly connectionLabel: string | undefined;
};

export function JiraConnectionSettingsPanel({
  siteUrl,
  authMethod,
  credentialStatus,
  connectionLabel,
}: JiraConnectionSettingsPanelProps): React.ReactElement {
  return (
    <section
      aria-labelledby="jira-connection-settings-heading"
      className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
      data-testid="jira-connection-settings"
    >
      <div>
        <h2 id="jira-connection-settings-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {JIRA_CONNECTION_SETTINGS_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {JIRA_CONNECTION_SETTINGS_LEAD}
        </p>
      </div>

      <dl className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <div>
          <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_FIELD_SITE_URL}</dt>
          <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="jira-site-url">
            {siteUrl}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_FIELD_AUTH_METHOD}</dt>
          <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="jira-auth-method">
            {authMethod}
          </dd>
        </div>
        <div>
          <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_FIELD_CREDENTIAL_STATUS}</dt>
          <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="jira-credential-status">
            {credentialStatus}
          </dd>
        </div>
        {connectionLabel ? (
          <div>
            <dt className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{JIRA_FIELD_CONNECTION_LABEL}</dt>
            <dd className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{connectionLabel}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
