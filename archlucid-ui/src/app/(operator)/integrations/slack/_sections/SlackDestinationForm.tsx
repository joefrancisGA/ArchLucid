"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveSlackAddDestinationCtaPresentation } from "@/lib/slack-integration-add-destination-cta";
import {
  slackIntegrationEventCatalog,
  type SlackIntegrationFormValues,
} from "@/lib/slack-integration-form-schema";
import {
  SLACK_INTEGRATION_ADD_SECTION_LEAD,
  SLACK_INTEGRATION_ADD_SECTION_TITLE,
  SLACK_INTEGRATION_SAVE_DISABLED_HELPER,
  SLACK_INTEGRATION_SECRET_HELPER,
  SLACK_INTEGRATION_SECRET_STORED_WARNING,
} from "@/lib/slack-integration-page-copy";
import type { SlackIntegrationTestFeedback } from "@/lib/slack-integration-test-feedback";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";

type SlackDestinationFormProps = {
  readonly canMutate: boolean;
  readonly loading: boolean;
  readonly testingForm: boolean;
  readonly formTestFeedback: SlackIntegrationTestFeedback | null;
  readonly onClearFormTestFeedback: () => void;
  readonly onSave: () => void;
  readonly onSendTest: () => void;
};

function FieldHelper(props: { readonly id: string; readonly children: string }): React.ReactElement {
  return (
    <p id={props.id} className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
      {props.children}
    </p>
  );
}

function FieldError(props: { readonly id: string; readonly message: string }): React.ReactElement {
  return (
    <p id={props.id} role="alert" className={cn("m-0 mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
      {props.message}
    </p>
  );
}

function SigningSecretField(props: { readonly disabled: boolean }): React.ReactElement {
  const { register, formState } = useFormContext<SlackIntegrationFormValues>();
  const [visible, setVisible] = useState(false);
  const errorMessage = formState.errors.secret?.message;

  return (
    <div>
      <Label htmlFor="slack-signing-secret">Signing secret (optional)</Label>
      <div className="mt-1 flex gap-2">
        <Input
          id="slack-signing-secret"
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          disabled={props.disabled}
          className={cn("font-mono", OPERATOR_TYPOGRAPHY.body)}
          aria-describedby="slack-signing-secret-helper slack-signing-secret-warning slack-signing-secret-error"
          {...register("secret")}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={props.disabled}
          aria-label={visible ? "Hide signing secret" : "Show signing secret"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? "Hide" : "Show"}
        </Button>
      </div>
      <FieldHelper id="slack-signing-secret-helper">{SLACK_INTEGRATION_SECRET_HELPER}</FieldHelper>
      <FieldHelper id="slack-signing-secret-warning">{SLACK_INTEGRATION_SECRET_STORED_WARNING}</FieldHelper>
      {errorMessage !== undefined ? (
        <FieldError id="slack-signing-secret-error" message={errorMessage} />
      ) : null}
    </div>
  );
}

/** Create form for a new Slack webhook destination. */
export function SlackDestinationForm(props: SlackDestinationFormProps): React.ReactElement {
  const {
    canMutate,
    loading,
    testingForm,
    formTestFeedback,
    onClearFormTestFeedback,
    onSave,
    onSendTest,
  } = props;
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SlackIntegrationFormValues>();
  const disabled = !canMutate || loading;
  const webhookUrl = useWatch({ control, name: "webhookUrl" });
  const previousWebhookUrlRef = useRef(webhookUrl);
  const formTestSucceeded = formTestFeedback?.kind === "success";
  const cta = resolveSlackAddDestinationCtaPresentation({
    formTestSucceeded,
    canMutate,
    loading,
    testingForm,
  });
  const saveDisabledReason: WhyDisabledCtaReason | null = cta.showSaveDisabledHelper
    ? { kind: "prerequisite", message: SLACK_INTEGRATION_SAVE_DISABLED_HELPER }
    : null;

  useEffect(() => {
    if (previousWebhookUrlRef.current === webhookUrl) {
      return;
    }

    previousWebhookUrlRef.current = webhookUrl;

    if (formTestFeedback !== null) {
      onClearFormTestFeedback();
    }
  }, [webhookUrl, formTestFeedback, onClearFormTestFeedback]);

  return (
    <section aria-labelledby="slack-add-destination-heading" className="space-y-5">
      <div>
        <h2 id="slack-add-destination-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {SLACK_INTEGRATION_ADD_SECTION_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SLACK_INTEGRATION_ADD_SECTION_LEAD}
        </p>
      </div>

      <div className="grid max-w-xl gap-5">
        <div>
          <Label htmlFor="slack-destination-name">Destination name</Label>
          <Input
            id="slack-destination-name"
            className="mt-1"
            placeholder="Governance alerts"
            disabled={disabled}
            title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
            aria-describedby="slack-destination-name-helper slack-destination-name-error"
            {...register("name")}
          />
          <FieldHelper id="slack-destination-name-helper">
            Use a name that identifies the team or Slack channel.
          </FieldHelper>
          {errors.name?.message !== undefined ? (
            <FieldError id="slack-destination-name-error" message={errors.name.message} />
          ) : null}
        </div>

        <div>
          <Label htmlFor="slack-minimum-severity">Minimum alert severity</Label>
          <select
            id="slack-minimum-severity"
            className={cn(
              "mt-1 block w-full rounded-md border border-neutral-300 bg-white p-2 shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring dark:border-neutral-700 dark:bg-neutral-950",
              OPERATOR_TYPOGRAPHY.body,
            )}
            disabled={disabled}
            title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
            aria-describedby="slack-minimum-severity-helper"
            {...register("minimumSeverity")}
          >
            <option value="Info">Info</option>
            <option value="Warning">Warning</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <FieldHelper id="slack-minimum-severity-helper">
            Only alerts at this severity or higher will be sent.
          </FieldHelper>
        </div>

        <div>
          <Label htmlFor="slack-webhook-url">Slack incoming webhook URL</Label>
          <Input
            id="slack-webhook-url"
            className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.body)}
            placeholder="https://hooks.slack.com/services/..."
            disabled={disabled}
            autoComplete="off"
            title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
            aria-describedby="slack-webhook-url-helper slack-webhook-url-error"
            {...register("webhookUrl")}
          />
          <FieldHelper id="slack-webhook-url-helper">
            Create an incoming webhook in Slack and paste its URL here.
          </FieldHelper>
          {errors.webhookUrl?.message !== undefined ? (
            <FieldError id="slack-webhook-url-error" message={errors.webhookUrl.message} />
          ) : null}
        </div>

        <SigningSecretField disabled={disabled} />

        <fieldset className="space-y-2">
          <legend className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Notifications to send</legend>
          <Controller
            name="eventTypes"
            control={control}
            render={({ field }) => (
              <div
                className="grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
                aria-describedby="slack-event-types-error"
              >
                {slackIntegrationEventCatalog.map((opt) => {
                  const checked = field.value.includes(opt.id);

                  return (
                    <label
                      key={opt.id}
                      className={cn("flex min-h-11 cursor-pointer items-start gap-3 leading-snug", OPERATOR_TYPOGRAPHY.body)}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => {
                          const next = checked
                            ? field.value.filter((value) => value !== opt.id)
                            : [...field.value, opt.id];
                          field.onChange(next);
                        }}
                        className="mt-1 h-4 w-4 shrink-0"
                      />
                      <span>
                        <span className="block font-medium text-al-text-primary">{opt.label}</span>
                        <span className="block text-al-text-secondary">{opt.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          />
          {errors.eventTypes?.message !== undefined ? (
            <FieldError id="slack-event-types-error" message={errors.eventTypes.message} />
          ) : null}
        </fieldset>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={cta.testVariant}
            disabled={disabled || testingForm}
            data-testid="slack-test-button"
            onClick={onSendTest}
          >
            {testingForm ? "Sending test…" : "Send test notification"}
          </Button>
          <Button
            type="button"
            variant={cta.saveVariant}
            disabled={cta.saveDisabled}
            title={canMutate ? undefined : enterpriseMutationControlDisabledTitle}
            data-testid="slack-save-button"
            onClick={onSave}
          >
            Save destination
          </Button>
        </div>
        <WhyDisabledCtaHint
          reason={saveDisabledReason}
          testId="slack-save-disabled-helper"
          className="max-w-prose"
        />
      </div>

      {formTestFeedback !== null ? (
        <p
          role={formTestFeedback.kind === "error" ? "alert" : "status"}
          className={cn(
            "m-0",
            OPERATOR_TYPOGRAPHY.body,
            formTestFeedback.kind === "error" ? "text-red-700 dark:text-red-300" : "text-teal-800 dark:text-teal-200",
          )}
          data-testid="slack-form-test-feedback"
        >
          {formTestFeedback.message}
        </p>
      ) : null}
    </section>
  );
}
