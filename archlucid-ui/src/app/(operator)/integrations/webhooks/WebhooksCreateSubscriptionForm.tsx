"use client";

import { cn } from "@/lib/utils";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { IntegrationConnectChecklist, type IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  WEBHOOKS_ABOUT_DEVELOPERS,
  WEBHOOKS_ABOUT_SECURITY,
  WEBHOOKS_ABOUT_WHAT_WE_SEND,
  WEBHOOKS_ABOUT_WHEN_TO_USE,
  WEBHOOKS_ALERT_PAYLOAD_SAMPLE_JSON,
  WEBHOOKS_CLOUD_EVENTS_ENVELOPE_NOTE,
  WEBHOOKS_DELIVERY_CONTRACT_HEADING,
  WEBHOOKS_DESTINATION_URL_HELPER,
  WEBHOOKS_DESTINATION_URL_LABEL,
  WEBHOOKS_EVENTS_HELPER,
  WEBHOOKS_FORM_DESTINATION_HEADING,
  WEBHOOKS_FORM_EVENTS_HEADING,
  WEBHOOKS_MUTATION_PREREQUISITE_NOTICE,
  WEBHOOKS_SAVE_LABEL,
  WEBHOOKS_SAVE_THEN_TEST_HELPER,
  WEBHOOKS_SAVING_LABEL,
  WEBHOOKS_SEVERITY_HELPER,
  WEBHOOKS_SEVERITY_LABEL,
  WEBHOOKS_SIGNATURE_ALGORITHM,
  WEBHOOKS_SIGNATURE_HEADER_NAME,
  WEBHOOKS_SIGNATURE_KEY_SCOPE_NOTE,
  WEBHOOKS_SIGNATURE_VALUE_PREFIX,
  WEBHOOKS_SIGNATURE_VERIFICATION,
  WEBHOOKS_SIGNING_SECRET_HELPER,
  WEBHOOKS_SIGNING_SECRET_LABEL,
} from "@/lib/webhooks-page-copy";
import { whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
import { webhookOutboundEventCatalog, type WebhookSettingsFormValues } from "@/lib/webhook-settings-form-schema";
import {
  parseWebhooksDeliveryContractOpenFromSearch,
  webhooksDeliveryContractDisclosureHrefFromSearch,
} from "@/lib/integrations/webhooks-delivery-contract-disclosure-url";
import {
  parseWebhooksTechnicalEventNameEventIdFromSearch,
  webhooksTechnicalEventNameDisclosureHrefFromSearch,
} from "@/lib/integrations/webhooks-technical-event-name-disclosure-url";

export type WebhooksCreateSubscriptionFormProps = {
  readonly register: UseFormRegister<WebhookSettingsFormValues>;
  readonly control: Control<WebhookSettingsFormValues>;
  readonly errors: FieldErrors<WebhookSettingsFormValues>;
  readonly canMutate: boolean;
  readonly isSaving: boolean;
  readonly loading: boolean;
  readonly canSubmitForm: boolean;
  readonly formReadinessMessage: string | null;
  readonly showAlertSeverityFilter: boolean;
  readonly secretVisible: boolean;
  readonly setSecretVisible: Dispatch<SetStateAction<boolean>>;
  readonly saveSuccessMessage: string | null;
  readonly setSaveSuccessMessage: Dispatch<SetStateAction<string | null>>;
  readonly webhooksCreateSteps: readonly IntegrationConnectChecklistStep[];
  readonly webhooksCreateEmphasizedStepId: string;
};

export function WebhooksCreateSubscriptionForm(props: WebhooksCreateSubscriptionFormProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const webhooksDeliveryContractOpenParam = searchParams.get("webhooksDeliveryContractOpen");
  const webhooksTechnicalEventNameEventIdParam = searchParams.get("webhooksTechnicalEventNameEventId");
  const [deliveryContractOpen, setDeliveryContractOpenState] = useState(() =>
    parseWebhooksDeliveryContractOpenFromSearch(webhooksDeliveryContractOpenParam),
  );

  const syncDeliveryContractOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        webhooksDeliveryContractDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setDeliveryContractOpen = useCallback(
    (open: boolean) => {
      setDeliveryContractOpenState(open);
      syncDeliveryContractOpenToUrl(open);
    },
    [syncDeliveryContractOpenToUrl],
  );

  useEffect(() => {
    setDeliveryContractOpenState(parseWebhooksDeliveryContractOpenFromSearch(webhooksDeliveryContractOpenParam));
  }, [webhooksDeliveryContractOpenParam]);

  const syncTechnicalEventNameOpenToUrl = useCallback(
    (eventId: string | null) => {
      router.replace(
        webhooksTechnicalEventNameDisclosureHrefFromSearch(searchParams.toString(), eventId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const technicalEventNameOpenId = parseWebhooksTechnicalEventNameEventIdFromSearch(
    webhooksTechnicalEventNameEventIdParam,
  );

  const {
    register,
    control,
    errors,
    canMutate,
    isSaving,
    loading,
    canSubmitForm,
    formReadinessMessage,
    showAlertSeverityFilter,
    secretVisible,
    setSecretVisible,
    saveSuccessMessage,
    setSaveSuccessMessage,
    webhooksCreateSteps,
    webhooksCreateEmphasizedStepId,
  } = props;

  return (
    <section
      aria-labelledby="webhook-create-heading"
      className={cn(
        "rounded-lg border border-neutral-200 dark:border-neutral-800",
        OPERATOR_LAYOUT.cardPadding,
        OPERATOR_LAYOUT.sectionStack,
      )}
    >
      <div>
        <h2 id="webhook-create-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          New subscription
        </h2>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {WEBHOOKS_SAVE_THEN_TEST_HELPER}
        </p>
      </div>

      {!canMutate ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="webhooks-mutation-prerequisite-notice"
          role="status"
        >
          {WEBHOOKS_MUTATION_PREREQUISITE_NOTICE}
        </p>
      ) : (
        <IntegrationConnectChecklist
          title="Create checklist"
          steps={webhooksCreateSteps}
          emphasizedStepId={webhooksCreateEmphasizedStepId}
          testIdPrefix="webhooks-create"
        />
      )}

      <div className={OPERATOR_LAYOUT.sectionStack}>
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{WEBHOOKS_FORM_DESTINATION_HEADING}</h3>
        <div className={cn("grid sm:grid-cols-2", OPERATOR_LAYOUT.unrelatedClusterGap)}>
          <div className="sm:col-span-2">
            <Label htmlFor="webhook-subscription-name">Subscription name</Label>
            <Input
              id="webhook-subscription-name"
              className="mt-1"
              disabled={!canMutate || isSaving}
              aria-invalid={errors.name?.message !== undefined ? true : undefined}
              aria-describedby={
                errors.name?.message !== undefined ? "webhook-subscription-name-error" : undefined
              }
              {...register("name")}
            />
            {errors.name?.message !== undefined ? (
              <p
                id="webhook-subscription-name-error"
                role="alert"
                className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}
              >
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="webhook-url">{WEBHOOKS_DESTINATION_URL_LABEL}</Label>
            <Input
              id="webhook-url"
              className={cn("mt-1 font-mono", OPERATOR_TYPOGRAPHY.body)}
              placeholder="https://example.com/webhooks/archlucid"
              disabled={!canMutate || isSaving}
              aria-invalid={errors.webhookUrl?.message !== undefined ? true : undefined}
              aria-describedby="webhook-url-helper webhook-url-error"
              {...register("webhookUrl")}
            />
            <p id="webhook-url-helper" className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {WEBHOOKS_DESTINATION_URL_HELPER}
            </p>
            {errors.webhookUrl?.message !== undefined ? (
              <p
                id="webhook-url-error"
                role="alert"
                className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}
              >
                {errors.webhookUrl.message}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="webhook-secret">{WEBHOOKS_SIGNING_SECRET_LABEL}</Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="webhook-secret"
                type={secretVisible ? "text" : "password"}
                autoComplete="new-password"
                className={cn("font-mono", OPERATOR_TYPOGRAPHY.body)}
                placeholder="Enter once — not shown after save"
                disabled={!canMutate || isSaving}
                aria-invalid={errors.secret?.message !== undefined ? true : undefined}
                aria-describedby="webhook-secret-helper webhook-secret-error"
                {...register("secret")}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={!canMutate || isSaving}
                aria-label={secretVisible ? "Hide signing secret" : "Show signing secret"}
                onClick={() => setSecretVisible((current) => !current)}
              >
                {secretVisible ? "Hide" : "Show"}
              </Button>
            </div>
            <p id="webhook-secret-helper" className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {WEBHOOKS_SIGNING_SECRET_HELPER}
            </p>
            {errors.secret?.message !== undefined ? (
              <p
                id="webhook-secret-error"
                role="alert"
                className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}
              >
                {errors.secret.message}
              </p>
            ) : null}
          </div>
        </div>

        <details
          className={cn(
            "rounded-md border border-neutral-200 p-4 dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="webhooks-delivery-contract-disclosure"
          open={deliveryContractOpen}
          onToggle={(event) => {
            setDeliveryContractOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary
            className={cn(
              "cursor-pointer select-none font-medium text-al-text-primary outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
              OPERATOR_DISCLOSURE_TRIGGER_CLASS,
            )}
          >
            {WEBHOOKS_DELIVERY_CONTRACT_HEADING}
          </summary>
          <div className={cn("mt-3 space-y-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <p className="m-0">{WEBHOOKS_ABOUT_WHEN_TO_USE}</p>
            <p className="m-0">{WEBHOOKS_ABOUT_WHAT_WE_SEND}</p>
            <p className="m-0">{WEBHOOKS_ABOUT_SECURITY}</p>
            <p className="m-0">{WEBHOOKS_ABOUT_DEVELOPERS}</p>
            <p className="m-0">{WEBHOOKS_CLOUD_EVENTS_ENVELOPE_NOTE}</p>
            <div>
              <p className="m-0 font-medium text-al-text-primary">Sample alert payload</p>
              <pre
                className={cn(
                  "mt-2 overflow-x-auto rounded-md border border-neutral-200 bg-neutral-50 p-3 font-mono text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/60",
                  OPERATOR_TYPOGRAPHY.badge,
                )}
              >
                {WEBHOOKS_ALERT_PAYLOAD_SAMPLE_JSON}
              </pre>
            </div>
            <div>
              <p className="m-0 font-medium text-al-text-primary">Signature header</p>
              <p className="m-0 mt-1">
                <span className="font-mono">{WEBHOOKS_SIGNATURE_HEADER_NAME}</span>:{" "}
                <span className="font-mono">
                  {WEBHOOKS_SIGNATURE_VALUE_PREFIX}
                  {"{lowercase-hex-digest}"}
                </span>
              </p>
              <p className="m-0 mt-2">{WEBHOOKS_SIGNATURE_ALGORITHM}</p>
              <p className="m-0 mt-2">{WEBHOOKS_SIGNATURE_VERIFICATION}</p>
              <p className="m-0 mt-2 text-al-text-primary">{WEBHOOKS_SIGNATURE_KEY_SCOPE_NOTE}</p>
            </div>
          </div>
        </details>
      </div>

      <div className={OPERATOR_LAYOUT.sectionStack}>
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>{WEBHOOKS_FORM_EVENTS_HEADING}</h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{WEBHOOKS_EVENTS_HELPER}</p>

        {showAlertSeverityFilter ? (
          <div>
            <Label htmlFor="webhook-minimum-severity">{WEBHOOKS_SEVERITY_LABEL}</Label>
            <select
              id="webhook-minimum-severity"
              className={cn(
                "mt-1 block w-full rounded-md border border-neutral-300 bg-white p-2 shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring dark:border-neutral-700 dark:bg-neutral-950",
                OPERATOR_TYPOGRAPHY.body,
              )}
              disabled={!canMutate || isSaving}
              {...register("minimumSeverity")}
            >
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {WEBHOOKS_SEVERITY_HELPER}
            </p>
            {errors.minimumSeverity?.message !== undefined ? (
              <p role="alert" className={cn("mt-1 text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
                {errors.minimumSeverity.message}
              </p>
            ) : null}
          </div>
        ) : null}

        <fieldset>
          <legend className="sr-only">Webhook events</legend>
          <Controller
            name="eventTypes"
            control={control}
            render={({ field }) => (
              <div className="grid gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
                {webhookOutboundEventCatalog.map((option) => {
                  const checked = field.value.includes(option.id);

                  return (
                    <label
                      key={option.id}
                      className={cn("flex cursor-pointer items-start gap-2 leading-snug", OPERATOR_TYPOGRAPHY.body)}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canMutate || isSaving}
                        onChange={() => {
                          const next = checked
                            ? field.value.filter((value) => value !== option.id)
                            : [...field.value, option.id];

                          field.onChange(next);
                        }}
                        className="mt-[3px] h-4 w-4"
                      />
                      <span className="min-w-0 space-y-0.5">
                        <span className="font-medium text-al-text-primary">{option.label}</span>
                        <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                          {option.description}
                        </span>
                        <details
                          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                          open={technicalEventNameOpenId === option.id}
                          onToggle={(event) => {
                            const open = (event.currentTarget as HTMLDetailsElement).open;
                            syncTechnicalEventNameOpenToUrl(open ? option.id : null);
                          }}
                        >
                          <summary
                            className={cn(
                              "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
                              OPERATOR_DISCLOSURE_TRIGGER_CLASS,
                            )}
                          >
                            Technical event name
                          </summary>
                          <span className={cn("mt-1 block font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.badge)}>
                            {option.id}
                          </span>
                        </details>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          />
        </fieldset>
        {errors.eventTypes?.message !== undefined ? (
          <p role="alert" className={cn("text-red-600 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>
            {errors.eventTypes.message}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end",
          OPERATOR_LAYOUT.controlClusterGap,
        )}
      >
        <WhyDisabledCtaHint
          id="webhook-save-readiness"
          testId="webhook-save-readiness"
          className="sm:mr-auto sm:text-left"
          reason={
            canMutate && !canSubmitForm && !isSaving && !loading && formReadinessMessage !== null
              ? whyDisabledIncompleteInput(formReadinessMessage)
              : null
          }
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!canMutate || loading || isSaving || !canSubmitForm}
          data-testid="webhook-save-button"
          aria-busy={isSaving}
          aria-describedby={
            canMutate && !canSubmitForm && !isSaving && !loading && formReadinessMessage !== null
              ? "webhook-save-readiness"
              : undefined
          }
        >
          {isSaving ? WEBHOOKS_SAVING_LABEL : WEBHOOKS_SAVE_LABEL}
        </Button>
      </div>

      {saveSuccessMessage !== null ? (
        <OperatorSuccessCallout
          message={saveSuccessMessage}
          testId="webhook-save-success-callout"
          onDismiss={() => setSaveSuccessMessage(null)}
        />
      ) : null}
    </section>
  );
}
