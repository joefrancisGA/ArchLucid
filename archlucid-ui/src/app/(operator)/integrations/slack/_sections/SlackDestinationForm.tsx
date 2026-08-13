"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveSlackAddDestinationCtaPresentation } from "@/lib/slack-integration-add-destination-cta";
import {
  slackIntegrationEventCatalog,
  type SlackIntegrationFormValues,
} from "@/lib/slack-integration-form-schema";
import {
  SLACK_FIELD_DESTINATION_NAME_LABEL,
  SLACK_FIELD_WEBHOOK_URL_LABEL,
  SLACK_INTEGRATION_ADD_SECTION_LEAD,
  SLACK_INTEGRATION_ADD_SECTION_TITLE,
  SLACK_INTEGRATION_SAVE_DISABLED_HELPER,
  SLACK_INTEGRATION_SECRET_HELPER,
} from "@/lib/slack-integration-page-copy";
import type { SlackIntegrationTestFeedback } from "@/lib/slack-integration-test-feedback";
import {
  firstWhyDisabledCtaReason,
  whyDisabledEnterpriseMutationControl,
  type WhyDisabledCtaReason,
} from "@/lib/why-disabled-cta";
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

const FOCUS_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2";
const SLACK_MUTATE_DISABLED_HINT_ID = "slack-mutate-disabled-hint";

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

function RequiredFieldLabel(props: { readonly htmlFor: string; readonly children: string }): React.ReactElement {
  return (
    <Label htmlFor={props.htmlFor}>
      {props.children} <span className="text-al-text-secondary">(required)</span>
    </Label>
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
          aria-describedby="slack-signing-secret-helper slack-signing-secret-error"
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
  const saveHintId = "slack-save-disabled-helper";
  const saveHintReason = firstWhyDisabledCtaReason([
    !canMutate ? whyDisabledEnterpriseMutationControl() : null,
    saveDisabledReason,
  ]);
  const fieldDescribedBySuffix = !canMutate ? ` ${SLACK_MUTATE_DISABLED_HINT_ID}` : "";

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
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {SLACK_INTEGRATION_ADD_SECTION_LEAD}
        </p>
      </div>

      {!canMutate ? (
        <WhyDisabledCtaHint
          id={SLACK_MUTATE_DISABLED_HINT_ID}
          reason={whyDisabledEnterpriseMutationControl()}
          testId={SLACK_MUTATE_DISABLED_HINT_ID}
          className="max-w-3xl"
        />
      ) : null}

      <div className="grid max-w-xl gap-5">
        <div>
          <RequiredFieldLabel htmlFor="slack-destination-name">{SLACK_FIELD_DESTINATION_NAME_LABEL}</RequiredFieldLabel>
          <Input
            id="slack-destination-name"
            className="mt-1"
            placeholder="Governance alerts"
            disabled={disabled}
            aria-describedby={`slack-destination-name-helper slack-destination-name-error${fieldDescribedBySuffix}`}
            aria-required="true"
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
          <Controller
            name="minimumSeverity"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <SelectTrigger
                  id="slack-minimum-severity"
                  className={cn("mt-1", FOCUS_RING_CLASS)}
                  aria-describedby={`slack-minimum-severity-helper${fieldDescribedBySuffix}`}
                >
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Info">Info</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldHelper id="slack-minimum-severity-helper">
            Only alerts at this severity or higher will be sent.
          </FieldHelper>
        </div>

        <div>
          <RequiredFieldLabel htmlFor="slack-webhook-url">{SLACK_FIELD_WEBHOOK_URL_LABEL}</RequiredFieldLabel>
          <Input
            id="slack-webhook-url"
            className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.body)}
            placeholder="https://hooks.slack.com/services/..."
            disabled={disabled}
            autoComplete="off"
            aria-describedby={`slack-webhook-url-helper slack-webhook-url-error${fieldDescribedBySuffix}`}
            aria-required="true"
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
                  const checkboxId = `slack-event-${opt.id}`;

                  return (
                    <div key={opt.id} className="flex min-h-11 items-start gap-3">
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        disabled={disabled}
                        className={cn("mt-1", FOCUS_RING_CLASS)}
                        onCheckedChange={() => {
                          const next = checked
                            ? field.value.filter((value) => value !== opt.id)
                            : [...field.value, opt.id];
                          field.onChange(next);
                        }}
                      />
                      <label htmlFor={checkboxId} className={cn("cursor-pointer leading-snug", OPERATOR_TYPOGRAPHY.body)}>
                        <span className="block font-medium text-al-text-primary">{opt.label}</span>
                        <span className="block text-al-text-secondary">{opt.description}</span>
                      </label>
                    </div>
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
            aria-describedby={saveHintReason !== null ? saveHintId : undefined}
            data-testid="slack-save-button"
            onClick={onSave}
          >
            Save destination
          </Button>
        </div>
        <WhyDisabledCtaHint
          id={saveHintId}
          reason={saveHintReason}
          testId={saveHintId}
          className="max-w-3xl"
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
