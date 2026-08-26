"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { FormProvider, useWatch } from "react-hook-form";

import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { WEBHOOKS_SUBSCRIPTIONS_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { PageHeading } from "@/components/PageHeading";
import { WebhooksApiKeysVocabularyRail } from "@/components/WebhooksApiKeysVocabularyRail";
import { WebhooksVsDlqVocabularyRail } from "@/components/WebhooksVsDlqVocabularyRail";
import { ConnectionStatusWebhooksVocabularyRail } from "@/components/ConnectionStatusWebhooksVocabularyRail";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { WebhooksIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  WEBHOOKS_ENABLE_CONFIRM_LABEL,
  WEBHOOKS_ENABLE_CONFIRM_TITLE,
  WEBHOOKS_NOT_CONFIGURED_NEXT_STEP,
  WEBHOOKS_PAGE_DESCRIPTION,
  WEBHOOKS_PAGE_TITLE,
  WEBHOOKS_SUBSCRIPTIONS_HEADING,
  webhooksEnableConfirmDescription,
  webhooksConfigurationStatusLabel,
  webhooksConfigurationStatusTagKind,
} from "@/lib/webhooks-page-copy";
import {
  resolveWebhooksCreateEmphasizedStepId,
  resolveWebhooksCreateSteps,
} from "@/lib/webhooks-create-checklist";
import { INTEGRATIONS_WEBHOOKS_PATH } from "@/lib/integrations-nav-paths";
import {
  resolveContinueLastWebhookSubscription,
  writeWebhookSubscriptionLastViewedId,
} from "@/lib/resolve-continue-last-webhook-subscription";

import { AlertRoutingSubscriptionDisableDialog } from "@/app/(operator)/integrations/_sections/AlertRoutingSubscriptionDisableDialog";

import { formatCustomerApiFailure, useWebhooksSettings } from "./use-webhooks-settings";
import { WebhooksContinueLastViewedRow } from "./WebhooksContinueLastViewedRow";
import { WebhooksCreateSubscriptionForm } from "./WebhooksCreateSubscriptionForm";
import { WebhooksSubscriptionsTable } from "./WebhooksSubscriptionsTable";

/** Integration hub for outbound HTTPS webhook subscriptions. */
export function WebhooksSettingsClient() {
  const {
    form,
    register,
    control,
    errors,
    isSavingRef,
    submit,
    canMutate,
    loading,
    isSaving,
    failure,
    testingId,
    testResults,
    saveSuccessMessage,
    pendingDisable,
    disableBusy,
    disableErrorMessage,
    pendingEnable,
    enableBusy,
    enableErrorMessage,
    secretVisible,
    formReadinessMessage,
    canSubmitForm,
    showAlertSeverityFilter,
    webhookRows,
    activeSubscriptionCount,
    load,
    onTestWebhook,
    onToggle,
    confirmEnableSubscription,
    confirmDisableSubscription,
    setSecretVisible,
    setSaveSuccessMessage,
    setPendingDisable,
    setDisableErrorMessage,
    setPendingEnable,
    setEnableErrorMessage,
  } = useWebhooksSettings();

  const watchedFormValues = useWatch({ control });
  const webhooksCreateSteps = resolveWebhooksCreateSteps({
    destinationConfigured:
      (watchedFormValues?.webhookUrl?.trim().length ?? 0) > 0 &&
      (watchedFormValues?.secret?.trim().length ?? 0) >= 16,
    eventsConfigured: (watchedFormValues?.eventTypes?.length ?? 0) > 0,
    subscriptionEnabled: activeSubscriptionCount > 0,
  });
  const webhooksCreateEmphasizedStepId = resolveWebhooksCreateEmphasizedStepId({
    destinationConfigured:
      (watchedFormValues?.webhookUrl?.trim().length ?? 0) > 0 &&
      (watchedFormValues?.secret?.trim().length ?? 0) >= 16,
    eventsConfigured: (watchedFormValues?.eventTypes?.length ?? 0) > 0,
    subscriptionEnabled: activeSubscriptionCount > 0,
  });
  const continueLastSubscription = useMemo(
    () => resolveContinueLastWebhookSubscription(webhookRows),
    [webhookRows],
  );

  function openSubscription(subscriptionId: string): void {
    writeWebhookSubscriptionLastViewedId(subscriptionId);
    document
      .querySelector(`[data-webhook-subscription-id="${subscriptionId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.querySelector<HTMLButtonElement>(`[data-testid="webhook-test-${subscriptionId}"]`)?.focus();
  }

  return (
    <OperatorPageContainer
      variant="workflow"
      className={cn("px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="webhooks-page"
    >
      <PageHeading
        navHref={INTEGRATIONS_WEBHOOKS_PATH}
        title={WEBHOOKS_PAGE_TITLE}
        variant="integration"
        bordered
        actions={<PageContextualHelpButton />}
        description={
          <>
            <p className={cn("m-0 leading-snug", OPERATOR_TYPOGRAPHY.body)}>{WEBHOOKS_PAGE_DESCRIPTION}</p>
            <div className="space-y-2" data-testid="webhooks-configuration-status">
              {loading ? (
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  Loading configuration status…
                </p>
              ) : (
                <StatusTag
                  kind={webhooksConfigurationStatusTagKind(webhookRows.length, activeSubscriptionCount)}
                  label={webhooksConfigurationStatusLabel(webhookRows.length, activeSubscriptionCount)}
                />
              )}
              {!loading && webhookRows.length === 0 ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="webhooks-not-configured-next-step"
                >
                  {WEBHOOKS_NOT_CONFIGURED_NEXT_STEP}
                </p>
              ) : null}
            </div>
          </>
        }
      />
      <WebhooksApiKeysVocabularyRail currentSurfaceId="webhooks" />
      <WebhooksVsDlqVocabularyRail currentSurfaceId="webhooks" />
      <ConnectionStatusWebhooksVocabularyRail currentSurfaceId="webhooks" />
      <WebhooksIntegrationEvidenceOrientationStrip />
      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={formatCustomerApiFailure(failure)}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <FormProvider {...form}>
        <form
          onSubmit={(event) => {
            if (isSavingRef.current) {
              event.preventDefault();

              return;
            }

            void submit(event);
          }}
          className={cn(OPERATOR_LAYOUT.sectionStack, !canMutate && "opacity-95")}
        >
          <section aria-labelledby="webhook-existing-heading" data-testid="webhooks-subscriptions-section">
            <div className={cn("mb-3 flex flex-wrap items-end justify-between", OPERATOR_LAYOUT.controlClusterGap)}>
              <div>
                <h2 id="webhook-existing-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                  {WEBHOOKS_SUBSCRIPTIONS_HEADING}
                </h2>
                {webhookRows.length > 0 ? (
                  <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {webhookRows.length} subscription{webhookRows.length === 1 ? "" : "s"} in this workspace.
                  </p>
                ) : null}
              </div>
              {webhookRows.length > 0 ? (
                <RefreshButton busy={loading} onClick={() => void load()} />
              ) : null}
            </div>

            {loading && webhookRows.length === 0 ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="webhooks-subscriptions-loading"
              >
                Loading subscriptions…
              </p>
            ) : webhookRows.length === 0 ? (
              <EnterpriseCompactEmptyState {...WEBHOOKS_SUBSCRIPTIONS_EMPTY_COMPACT} />
            ) : (
              <>
              {continueLastSubscription !== null ? (
                <WebhooksContinueLastViewedRow
                  target={continueLastSubscription}
                  onOpen={openSubscription}
                />
              ) : null}
              <WebhooksSubscriptionsTable
                webhookRows={webhookRows}
                testingId={testingId}
                testResults={testResults}
                canMutate={canMutate}
                loading={loading}
                onTestWebhook={(routingSubscriptionId) => {
                  void onTestWebhook(routingSubscriptionId);
                }}
                onToggle={(routingSubscriptionId, subscriptionName, isEnabled) => {
                  void onToggle(routingSubscriptionId, subscriptionName, isEnabled);
                }}
              />
              </>
            )}
          </section>

          <WebhooksCreateSubscriptionForm
            register={register}
            control={control}
            errors={errors}
            canMutate={canMutate}
            isSaving={isSaving}
            loading={loading}
            canSubmitForm={canSubmitForm}
            formReadinessMessage={formReadinessMessage}
            showAlertSeverityFilter={showAlertSeverityFilter}
            secretVisible={secretVisible}
            setSecretVisible={setSecretVisible}
            saveSuccessMessage={saveSuccessMessage}
            setSaveSuccessMessage={setSaveSuccessMessage}
            webhooksCreateSteps={webhooksCreateSteps}
            webhooksCreateEmphasizedStepId={webhooksCreateEmphasizedStepId}
          />
        </form>
      </FormProvider>

      <AlertRoutingSubscriptionDisableDialog
        target={pendingDisable}
        busy={disableBusy}
        errorMessage={disableErrorMessage}
        onCancel={() => {
          if (!disableBusy) {
            setPendingDisable(null);
            setDisableErrorMessage(null);
          }
        }}
        onConfirm={() => {
          void confirmDisableSubscription();
        }}
      />

      <ConfirmationDialog
        open={pendingEnable !== null}
        onOpenChange={(open) => {
          if (!open && !enableBusy) {
            setPendingEnable(null);
            setEnableErrorMessage(null);
          }
        }}
        title={WEBHOOKS_ENABLE_CONFIRM_TITLE}
        description={webhooksEnableConfirmDescription(pendingEnable?.subscriptionName ?? "")}
        confirmLabel={WEBHOOKS_ENABLE_CONFIRM_LABEL}
        variant="default"
        busy={enableBusy}
        onConfirm={() => {
          void confirmEnableSubscription();
        }}
        extraContent={
          enableErrorMessage !== null ? (
            <p
              className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")}
              role="alert"
              data-testid="webhook-subscription-enable-error"
            >
              {enableErrorMessage}
            </p>
          ) : null
        }
      />
    </OperatorPageContainer>
  );
}
