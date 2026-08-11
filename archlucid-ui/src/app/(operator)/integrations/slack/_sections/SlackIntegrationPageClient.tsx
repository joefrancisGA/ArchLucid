"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { PageHeading } from "@/components/PageHeading";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { TeamsSlackNotificationVocabularyRail } from "@/components/TeamsSlackNotificationVocabularyRail";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  createAlertRoutingSubscription,
  dryRunOutboundWebhook,
  listAlertRoutingSubscriptions,
  testWebhookSubscription,
  toggleAlertRoutingSubscription,
} from "@/lib/api";
import { INTEGRATIONS_SLACK_PATH } from "@/lib/integrations-nav-paths";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  slackIntegrationDefaultValues,
  slackIntegrationFormSchema,
  type SlackIntegrationFormValues,
} from "@/lib/slack-integration-form-schema";
import {
  SLACK_INTEGRATION_DISABLE_CONFIRM,
  SLACK_INTEGRATION_NOT_CONFIGURED_NEXT_STEP,
  SLACK_INTEGRATION_PAGE_SUBTITLE,
  SLACK_INTEGRATION_PAGE_TITLE,
  slackIntegrationConfigurationStatusLabel,
  slackIntegrationConfigurationStatusTagKind,
} from "@/lib/slack-integration-page-copy";
import {
  SLACK_INTEGRATION_DISABLE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_ENABLE_SUCCESS_MESSAGE,
  SLACK_INTEGRATION_SAVE_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import {
  interpretSlackIntegrationTestResult,
  type SlackIntegrationTestFeedback,
} from "@/lib/slack-integration-test-feedback";
import { buildWebhookSubscriptionMetadata } from "@/lib/webhook-subscription-metadata";
import { cn } from "@/lib/utils";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

import { SlackDestinationForm } from "./SlackDestinationForm";
import { SlackDestinationsPanel } from "./SlackDestinationsPanel";
import { SlackIntegrationAside } from "./SlackIntegrationAside";
const SLACK_CHANNEL_TYPE = "SlackWebhook";

const SAVE_FAILURE_MESSAGE = "We could not save this destination. Check the fields and try again.";

/** Slack alert routing — incoming webhook destinations for governance alerts in this workspace scope. */
export function SlackIntegrationPageClient(): React.ReactElement {
  const canMutate = useOperateCapability();
  const [items, setItems] = useState<AlertRoutingSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testingForm, setTestingForm] = useState(false);
  const [formTestFeedback, setFormTestFeedback] = useState<SlackIntegrationTestFeedback | null>(null);
  const [rowTestFeedback, setRowTestFeedback] = useState<Record<string, SlackIntegrationTestFeedback>>({});
  const [mutationSuccessMessage, setMutationSuccessMessage] = useState<string | null>(null);

  const form = useForm<SlackIntegrationFormValues>({
    resolver: zodResolver(slackIntegrationFormSchema),
    defaultValues: slackIntegrationDefaultValues,
    mode: "onBlur",
  });

  const { handleSubmit, reset } = form;

  const slackRows = useMemo(
    () => items.filter((row) => row.channelType === SLACK_CHANNEL_TYPE),
    [items],
  );

  const activeDestinationCount = useMemo(
    () => slackRows.filter((row) => row.isEnabled === true).length,
    [slackRows],
  );

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setFailure(null);

    try {
      const data = await listAlertRoutingSubscriptions();
      setItems(data);
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onTestDestination(routingSubscriptionId: string): Promise<void> {
    if (testingId !== null) {
      return;
    }

    setTestingId(routingSubscriptionId);

    try {
      const result = await testWebhookSubscription(routingSubscriptionId);
      const feedback = interpretSlackIntegrationTestResult(result);
      setRowTestFeedback((prev) => ({ ...prev, [routingSubscriptionId]: feedback }));
    } catch {
      setRowTestFeedback((prev) => ({
        ...prev,
        [routingSubscriptionId]: {
          kind: "error",
          message: "We could not deliver the test notification. Check the webhook URL and Slack permissions.",
        },
      }));
    } finally {
      setTestingId(null);
    }
  }

  const onSendFormTest = handleSubmit(async (values) => {
    if (!canMutate) {
      return;
    }

    setFormTestFeedback(null);
    setTestingForm(true);

    try {
      const result = await dryRunOutboundWebhook({
        targetUrl: values.webhookUrl.trim(),
        sharedSecret: values.secret.trim().length > 0 ? values.secret.trim() : null,
      });
      setFormTestFeedback(interpretSlackIntegrationTestResult(result));
    } catch {
      setFormTestFeedback({
        kind: "error",
        message: "We could not deliver the test notification. Check the webhook URL and Slack permissions.",
      });
    } finally {
      setTestingForm(false);
    }
  });

  async function onToggleDestination(routingSubscriptionId: string, isEnabled: boolean): Promise<void> {
    if (!canMutate) {
      return;
    }

    if (isEnabled) {
      const confirmed = window.confirm(SLACK_INTEGRATION_DISABLE_CONFIRM);

      if (!confirmed) {
        return;
      }
    }

    setFailure(null);
    setMutationSuccessMessage(null);

    try {
      await toggleAlertRoutingSubscription(routingSubscriptionId);
      await load();
      setMutationSuccessMessage(
        isEnabled ? SLACK_INTEGRATION_DISABLE_SUCCESS_MESSAGE : SLACK_INTEGRATION_ENABLE_SUCCESS_MESSAGE,
      );
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    }
  }

  const onSave = handleSubmit(async (values) => {
    if (!canMutate) {
      return;
    }

    setFailure(null);
    setFormTestFeedback(null);
    setMutationSuccessMessage(null);

    try {
      await createAlertRoutingSubscription({
        name: values.name.trim(),
        channelType: SLACK_CHANNEL_TYPE,
        destination: values.webhookUrl.trim(),
        minimumSeverity: values.minimumSeverity,
        isEnabled: true,
        metadataJson: buildWebhookSubscriptionMetadata(values.secret, values.eventTypes),
      });
      reset(slackIntegrationDefaultValues);
      await load();
      setMutationSuccessMessage(SLACK_INTEGRATION_SAVE_SUCCESS_MESSAGE);
    } catch {
      setFailure({
        message: SAVE_FAILURE_MESSAGE,
        problem: null,
        correlationId: null,
        httpStatus: null,
        retryAfterSeconds: null,
      });
    }
  });

  return (
    <div
      className={cn("w-full max-w-[68rem] px-4 py-4 sm:px-6 lg:px-8", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="integrations-slack-page"
    >
      <PageHeading
        navHref={INTEGRATIONS_SLACK_PATH}
        title={SLACK_INTEGRATION_PAGE_TITLE}
        variant="integration"
        bordered
        actions={<PageContextualHelpButton />}
        description={
          <>
            <p className={cn("m-0 max-w-2xl leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {SLACK_INTEGRATION_PAGE_SUBTITLE}
            </p>
            <div className="space-y-2" data-testid="slack-configuration-status">
              {loading ? (
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  Loading configuration status…
                </p>
              ) : (
                <StatusTag
                  kind={slackIntegrationConfigurationStatusTagKind(activeDestinationCount)}
                  label={slackIntegrationConfigurationStatusLabel(activeDestinationCount)}
                />
              )}
              {!loading && activeDestinationCount === 0 ? (
                <p
                  className={cn("m-0 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="slack-not-configured-next-step"
                >
                  {SLACK_INTEGRATION_NOT_CONFIGURED_NEXT_STEP}
                </p>
              ) : null}
            </div>
          </>
        }
      />
      <TeamsSlackNotificationVocabularyRail currentSurfaceId="slack" />
      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {mutationSuccessMessage !== null ? (
        <OperatorSuccessCallout
          message={mutationSuccessMessage}
          testId="slack-integration-mutation-success-callout"
          onDismiss={() => setMutationSuccessMessage(null)}
        />
      ) : null}

      <FormProvider {...form}>
        <div
          className={cn(
            "grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start",
            OPERATOR_LAYOUT.unrelatedClusterGap,
          )}
        >
          <div className={cn("min-w-0", OPERATOR_LAYOUT.sectionStack, !canMutate && "opacity-95")}>
            <SlackDestinationForm
              canMutate={canMutate}
              loading={loading}
              testingForm={testingForm}
              formTestFeedback={formTestFeedback}
              onSave={() => void onSave()}
              onSendTest={() => void onSendFormTest()}
            />

            <SlackDestinationsPanel
              destinations={slackRows}
              loading={loading}
              canMutate={canMutate}
              testingId={testingId}
              rowTestFeedback={rowTestFeedback}
              onRefresh={() => void load()}
              onTest={(routingSubscriptionId) => void onTestDestination(routingSubscriptionId)}
              onToggle={(routingSubscriptionId, isEnabled) =>
                void onToggleDestination(routingSubscriptionId, isEnabled)
              }
            />
          </div>

          <SlackIntegrationAside />
        </div>
      </FormProvider>
    </div>
  );
}
