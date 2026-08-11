"use client";

import Link from "next/link";

import { PageHeading } from "@/components/PageHeading";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { TeamsSlackNotificationVocabularyRail } from "@/components/TeamsSlackNotificationVocabularyRail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { INTEGRATIONS_READINESS_PATH, INTEGRATIONS_SLACK_PATH, INTEGRATIONS_TEAMS_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  TEAMS_INTEGRATION_CONNECT_SECTION_LEAD,
  TEAMS_INTEGRATION_CONNECT_SECTION_TITLE,
  TEAMS_INTEGRATION_DEMO_CAPABILITY_DESCRIPTION,
  TEAMS_INTEGRATION_DESTINATION_NAME_HELPER,
  TEAMS_INTEGRATION_DRAFT_NOT_SAVED_HELPER,
  TEAMS_INTEGRATION_PAGE_SUBTITLE,
  TEAMS_INTEGRATION_PAGE_TITLE,
  TEAMS_INTEGRATION_SECRET_EXAMPLE,
  TEAMS_INTEGRATION_SECRET_HELPER,
  TEAMS_INTEGRATION_SECRET_NAME_LABEL,
  teamsIntegrationConnectionStatusLabel,
} from "@/lib/teams-integration-page-copy";
import { cn } from "@/lib/utils";

import { TeamsConnectionSummary } from "./TeamsConnectionSummary";
import { TeamsIntegrationAside } from "./TeamsIntegrationAside";
import { TeamsNotificationsSelector } from "./TeamsNotificationsSelector";
import type { TeamsNotificationsIntegrationPageViewModel } from "./teams-notifications-integration-view-model";

type Props = {
  readonly model: TeamsNotificationsIntegrationPageViewModel;
};

export function TeamsNotificationsIntegrationPageView(props: Props): React.ReactElement {
  const m = props.model;

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Microsoft Teams integration"
        description={TEAMS_INTEGRATION_DEMO_CAPABILITY_DESCRIPTION}
      />
    );
  }

  const destinationName =
    m.label.trim().length > 0 ? m.label.trim() : m.secretName.trim().length > 0 ? m.secretName.trim() : "Teams channel";

  const validationMessage =
    m.secretValidation !== null && m.secretValidation.outcome !== "invalid-name"
      ? m.secretValidation.message
      : null;
  const validationKind = m.secretValidation === null ? null : m.secretValidation.outcome === "valid" ? "success" : "error";

  return (
    <div className="w-full max-w-[68rem] space-y-8 px-4 py-8 sm:px-6 lg:px-8" data-testid="integrations-teams-page">
      <PageHeading
        navHref={INTEGRATIONS_TEAMS_PATH}
        title={TEAMS_INTEGRATION_PAGE_TITLE}
        variant="integration"
        bordered
        actions={<PageContextualHelpButton />}
        description={
          <>
            <p className={cn("m-0 max-w-2xl leading-relaxed", OPERATOR_TYPOGRAPHY.body)}>
              {TEAMS_INTEGRATION_PAGE_SUBTITLE}
            </p>
            <p
              className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              data-testid="teams-connection-status"
            >
              {m.loading ? "Loading connection status…" : teamsIntegrationConnectionStatusLabel(m.connectionStatus)}
            </p>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              <Link className={OPERATOR_LINK.inline} href={INTEGRATIONS_READINESS_PATH}>
                Integration readiness
              </Link>
              {" · "}
              <Link className={OPERATOR_LINK.inline} href={INTEGRATIONS_SLACK_PATH}>
                Slack notifications
              </Link>
            </p>
          </>
        }
      />
      <TeamsSlackNotificationVocabularyRail currentSurfaceId="teams" />
{m.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}

      {m.mutationSuccessMessage !== null ? (
        <OperatorSuccessCallout
          message={m.mutationSuccessMessage}
          testId="teams-integration-mutation-success-callout"
          onDismiss={() => m.setMutationSuccessMessage(null)}
        />
      ) : null}

      {m.loading && m.conn === null ? (
        <OperatorLoadingNotice>Loading Teams configuration…</OperatorLoadingNotice>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
          <div className={cn("min-w-0 space-y-8", !m.canMutate && "opacity-95")}>
            {m.conn?.isConfigured === true ? (
              <TeamsConnectionSummary
                conn={m.conn}
                destinationName={destinationName}
                status={m.connectionStatus}
                lastTestMessage={m.lastTestMessage}
              />
            ) : null}

            <section aria-labelledby="teams-connect-heading" className="space-y-5">
              <div>
                <h2 id="teams-connect-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  {TEAMS_INTEGRATION_CONNECT_SECTION_TITLE}
                </h2>
                <p className={cn("m-0 mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {TEAMS_INTEGRATION_CONNECT_SECTION_LEAD}
                </p>
                {m.conn?.isConfigured !== true ? (
                  <p
                    className={cn(
                      "m-0 mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
                      OPERATOR_TYPOGRAPHY.helper,
                    )}
                    role="status"
                    data-testid="teams-draft-not-saved"
                  >
                    {TEAMS_INTEGRATION_DRAFT_NOT_SAVED_HELPER}
                  </p>
                ) : null}
              </div>

              <div className="grid max-w-xl gap-5">
                <div>
                  <Label htmlFor="kv-secret">{TEAMS_INTEGRATION_SECRET_NAME_LABEL}</Label>
                  <Input
                    id="kv-secret"
                    name="keyVaultSecretName"
                    value={m.secretName}
                    onChange={(event) => m.setSecretName(event.target.value)}
                    disabled={!m.canMutate || m.saving}
                    autoComplete="off"
                    placeholder="teams-governance-alerts-prod"
                    className="placeholder:text-al-text-secondary/70"
                    aria-describedby="kv-secret-helper kv-secret-example kv-secret-error"
                  />
                  <p id="kv-secret-helper" className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {TEAMS_INTEGRATION_SECRET_HELPER}
                  </p>
                  <p id="kv-secret-example" className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {TEAMS_INTEGRATION_SECRET_EXAMPLE}
                  </p>
                  {m.secretValidation !== null && m.secretValidation.outcome === "invalid-name" ? (
                    <p id="kv-secret-error" role="alert" className={cn("m-0 mt-1 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.body)}>
                      {m.secretValidation.message}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor="teams-destination-name">Destination name (optional)</Label>
                  <Input
                    id="teams-destination-name"
                    name="label"
                    value={m.label}
                    onChange={(event) => m.setLabel(event.target.value)}
                    disabled={!m.canMutate || m.saving}
                    autoComplete="off"
                    placeholder="Architecture governance"
                    className="placeholder:text-al-text-secondary/70"
                    aria-describedby="teams-destination-name-helper"
                  />
                  <p id="teams-destination-name-helper" className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {TEAMS_INTEGRATION_DESTINATION_NAME_HELPER}
                  </p>
                </div>

                <TeamsNotificationsSelector
                  enabledTriggers={m.enabledTriggers}
                  canMutate={m.canMutate}
                  saving={m.saving}
                  showValidationError={m.showTriggerValidationError}
                  onToggle={m.toggleTrigger}
                  onSelectRecommended={m.onSelectRecommended}
                  onSelectAll={m.onSelectAll}
                  onClearAll={m.onClearAll}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  disabled={!m.canMutate || m.saving}
                  title={m.canMutate ? undefined : enterpriseMutationControlDisabledTitle}
                  data-testid="teams-save-button"
                  onClick={() => void m.onSave()}
                >
                  {m.conn?.isConfigured === true ? "Save changes" : "Save Teams connection"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!m.canMutate || m.saving || m.validating || m.secretName.trim().length === 0}
                  onClick={() => void m.onValidateSecret()}
                >
                  {m.validating ? "Validating…" : "Validate secret"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!m.canMutate || m.saving || m.testing || !m.canSendTest}
                  data-testid="teams-test-button"
                  onClick={() => void m.onSendTest()}
                >
                  {m.testing ? "Sending test…" : "Send test notification"}
                </Button>
                {m.conn?.isConfigured === true ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!m.canMutate || m.saving}
                    onClick={() => void m.onRemove()}
                  >
                    Remove connection
                  </Button>
                ) : null}
              </div>

              {m.testMessage !== null && m.testKind !== null ? (
                <p
                  role={m.testKind === "error" ? "alert" : "status"}
                  className={cn(
                    "m-0",
                    OPERATOR_TYPOGRAPHY.body,
                    m.testKind === "error" ? "text-red-700 dark:text-red-300" : "text-teal-800 dark:text-teal-200",
                  )}
                  data-testid="teams-form-test-feedback"
                >
                  {m.testMessage}
                </p>
              ) : null}
            </section>
          </div>

          <TeamsIntegrationAside
            validationMessage={validationMessage}
            validationKind={validationKind}
            testMessage={m.testMessage}
            testKind={m.testKind}
          />
        </div>
      )}

      {!m.canMutate ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Your role can view this page. Saving, validating, testing, and removing a connection require elevated
          permissions.
        </p>
      ) : null}
    </div>
  );
}
