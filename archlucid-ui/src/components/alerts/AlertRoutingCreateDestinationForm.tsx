"use client";

import { cn } from "@/lib/utils";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { AlertRoutingCriteriaFields } from "@/components/alerts/AlertRoutingCriteriaFields";
import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { alertRoutingCreateSubscriptionButtonLabelReaderRank } from "@/lib/enterprise-controls-context-copy";
import type { AlertRoutingCriteria } from "@/lib/alert-routing-criteria";
import {
  destinationFieldHelper,
  destinationFieldLabel,
  destinationFieldPlaceholder,
  isWebhookChannelType,
  type AlertRoutingFieldErrors,
} from "@/lib/alert-routing-form";
import { ALERT_ROUTING_DESTINATION_NAME_PLACEHOLDER } from "@/lib/alert-routing-presentation";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export type AlertRoutingCreateDestinationFormProps = {
  readonly formSectionRef: React.RefObject<HTMLElement | null>;
  readonly isEmptyComposition: boolean;
  readonly canEditRouting: boolean;
  readonly canMutateRouting: boolean;
  readonly creating: boolean;
  readonly formValid: boolean;
  readonly name: string;
  readonly channelType: string;
  readonly destination: string;
  readonly minimumSeverity: string;
  readonly routingCriteria: AlertRoutingCriteria;
  readonly fieldErrors: AlertRoutingFieldErrors;
  readonly thresholdPreview: {
    readonly preview: string;
    readonly criticalExcludedWarning: string | null;
  };
  readonly alertRoutingCreateSteps: readonly IntegrationConnectChecklistStep[];
  readonly alertRoutingCreateEmphasizedStepId: string;
  readonly mutationDisabledReason: string | null;
  readonly mutationDisabledHintId: string;
  readonly onNameChange: (value: string) => void;
  readonly onChannelTypeChange: (value: string) => void;
  readonly onDestinationChange: (value: string) => void;
  readonly onMinimumSeverityChange: (value: string) => void;
  readonly onRoutingCriteriaChange: (criteria: AlertRoutingCriteria) => void;
  readonly onCreate: (sendTestAfterSave: boolean) => void;
  readonly onResetForm: () => void;
};

export function AlertRoutingCreateDestinationForm(
  props: AlertRoutingCreateDestinationFormProps,
): React.JSX.Element {
  return (
    <section
      ref={props.formSectionRef}
      tabIndex={-1}
      aria-labelledby="alert-routing-form-heading"
      className={cn(
        "space-y-6 rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-950",
        !props.canEditRouting && "opacity-90",
      )}
    >
      <h3 id="alert-routing-form-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {props.isEmptyComposition ? "Set up alert delivery" : "Add another destination"}
      </h3>
      {props.isEmptyComposition ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Create your first email or webhook destination. Qualifying findings notify your team when severity
          thresholds are met.
        </p>
      ) : null}

      <IntegrationConnectChecklist
        title="Destination checklist"
        steps={props.alertRoutingCreateSteps}
        emphasizedStepId={props.alertRoutingCreateEmphasizedStepId}
        testIdPrefix="alert-routing-create"
      />

      <fieldset className="space-y-4 border-0 p-0" disabled={!props.canEditRouting}>
        <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          Destination name
          <input
            value={props.name}
            onChange={(e) => {
              props.onNameChange(e.target.value);
            }}
            placeholder={ALERT_ROUTING_DESTINATION_NAME_PLACEHOLDER}
            disabled={!props.canEditRouting || props.creating}
            aria-invalid={props.fieldErrors.name !== undefined}
            aria-describedby={props.fieldErrors.name ? "alert-routing-name-error" : undefined}
            className="mt-1 block min-h-11 w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-600"
          />
          {props.fieldErrors.name ? (
            <span id="alert-routing-name-error" className={cn("mt-1 block text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}>
              {props.fieldErrors.name}
            </span>
          ) : null}
        </label>
        <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          Notification channel
          <select
            value={props.channelType}
            onChange={(e) => {
              props.onChannelTypeChange(e.target.value);
            }}
            disabled={!props.canEditRouting || props.creating}
            className="mt-1 block min-h-11 w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-600"
          >
            <option value="Email">Email</option>
            <option value="TeamsWebhook">Microsoft Teams</option>
            <option value="SlackWebhook">Slack</option>
            <option value="OnCallWebhook">On-call webhook</option>
          </select>
        </label>
        <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          {destinationFieldLabel(props.channelType)}
          <input
            value={props.destination}
            onChange={(e) => {
              props.onDestinationChange(e.target.value);
            }}
            placeholder={destinationFieldPlaceholder(props.channelType)}
            disabled={!props.canEditRouting || props.creating}
            aria-invalid={props.fieldErrors.destination !== undefined}
            aria-describedby={
              props.fieldErrors.destination ? "alert-routing-destination-error" : "alert-routing-destination-help"
            }
            className={cn(
              "mt-1 block min-h-11 w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-600",
              props.channelType === "Email" ? "" : "font-mono",
            )}
            data-testid="alert-routing-destination-input"
          />
          <span
            id="alert-routing-destination-help"
            className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          >
            {destinationFieldHelper(props.channelType)}
          </span>
          {props.fieldErrors.destination ? (
            <span
              id="alert-routing-destination-error"
              className={cn("mt-1 block text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)}
            >
              {props.fieldErrors.destination}
            </span>
          ) : null}
        </label>
      </fieldset>

      <fieldset className="space-y-3 border-0 p-0" disabled={!props.canEditRouting}>
        <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          Alert threshold
        </p>
        <label className={cn("block text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          Minimum severity
          <select
            value={props.minimumSeverity}
            onChange={(e) => {
              props.onMinimumSeverityChange(e.target.value);
            }}
            disabled={!props.canEditRouting || props.creating}
            className="mt-1 block min-h-11 w-full rounded-md border border-neutral-300 p-2 dark:border-neutral-600"
            data-testid="alert-routing-minimum-severity"
          >
            <option value="Info">Info</option>
            <option value="Warning">Warning</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </label>
        <p
          className={cn(
            "rounded-md bg-neutral-50 px-3 py-2 text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="alert-routing-threshold-preview"
        >
          {props.thresholdPreview.preview}
        </p>
        {props.thresholdPreview.criticalExcludedWarning !== null ? (
          <p
            className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}
            data-testid="alert-routing-threshold-critical-warning"
            role="status"
          >
            {props.thresholdPreview.criticalExcludedWarning}
          </p>
        ) : null}
      </fieldset>

      <AlertRoutingCriteriaFields
        criteria={props.routingCriteria}
        onChange={props.onRoutingCriteriaChange}
        disabled={!props.canEditRouting || props.creating}
      />

      <div className="flex flex-col items-start gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-700">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              props.onCreate(false);
            }}
            disabled={!props.canEditRouting || props.creating || !props.formValid}
            aria-describedby={props.mutationDisabledReason === null ? undefined : props.mutationDisabledHintId}
            data-testid="alert-routing-create-destination"
          >
            {props.creating
              ? "Creating destination…"
              : props.canMutateRouting
                ? "Create notification destination"
                : alertRoutingCreateSubscriptionButtonLabelReaderRank}
          </Button>
          {isWebhookChannelType(props.channelType) ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                props.onCreate(true);
              }}
              disabled={!props.canEditRouting || props.creating || !props.formValid}
            >
              {props.creating ? "Working…" : "Send test notification"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              props.onResetForm();
            }}
            disabled={props.creating}
          >
            Reset form
          </Button>
        </div>
        <WhyDisabledCtaHint
          id={props.mutationDisabledHintId}
          reason={props.mutationDisabledReason}
          testId="alert-routing-mutate-disabled-hint"
        />
      </div>
    </section>
  );
}
