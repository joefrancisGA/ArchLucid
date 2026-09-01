"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import type { ReactElement } from "react";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { DigestSubscriptionCreateFormViewModel } from "./use-digest-subscription-create-form";

export type DigestSubscriptionCreateFormFieldsProps = {
  readonly form: DigestSubscriptionCreateFormViewModel;
};

export function DigestSubscriptionCreateFormFields(props: DigestSubscriptionCreateFormFieldsProps): ReactElement {
  const { form } = props;

  return (
    <>
      {form.sampleModeBlocked ? (
        <p
          className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="digest-subscriptions-sample-blocked"
        >
          Digest subscriptions are read-only in the public sample workspace.{" "}
          <Link className="text-al-link underline-offset-2 hover:underline" href="/get-started">
            Start an evaluation
          </Link>{" "}
          to configure delivery for your organization.
        </p>
      ) : null}

      <IntegrationConnectChecklist
        title="Subscription checklist"
        steps={form.digestCreateSteps}
        emphasizedStepId={form.digestCreateEmphasizedStepId}
        testIdPrefix="digest-subscription-create"
      />

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="digest-subscription-name">Delivery name</Label>
          <Input
            id="digest-subscription-name"
            value={form.name}
            onChange={(event) => form.setName(event.target.value)}
            onBlur={() => form.setNameTouched(true)}
            placeholder={form.suggestedSubscriptionName(form.channelType)}
            readOnly={!form.canEdit}
          />
          {!form.nameTouched && form.name.trim().length === 0 ? (
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              A short label so your team can recognize this destination later.
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="digest-subscription-channel">Channel</Label>
          <select
            id="digest-subscription-channel"
            value={form.channelType}
            onChange={(event) => form.handleChannelTypeChange(event.target.value)}
            disabled={!form.canEdit}
            className={cn(
              "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {form.DIGEST_SUBSCRIPTION_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {form.channelDisplayLabel(channel)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5 md:col-span-2">
          <Label htmlFor="digest-subscription-destination">{form.destinationLabelText}</Label>
          <Input
            id="digest-subscription-destination"
            value={form.destination}
            onChange={(event) => form.setDestination(event.target.value)}
            onBlur={() => form.setDestinationTouched(true)}
            placeholder={form.channelDestinationPlaceholder(form.channelType)}
            readOnly={!form.canEdit}
            required={form.isEmailChannel(form.channelType)}
            aria-invalid={form.destinationTouched && form.destinationError !== null}
            aria-describedby={
              form.createDisabledReason !== null && form.destination.trim().length === 0
                ? `${form.createDisabledHintId} digest-subscription-destination-help`
                : "digest-subscription-destination-help"
            }
          />
          <p
            id="digest-subscription-destination-help"
            className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          >
            {form.channelDestinationHelper(form.channelType)}
          </p>
          {form.destinationTouched && form.destinationError !== null ? (
            <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
              {form.destinationError}
            </p>
          ) : null}
        </div>

        {form.integrationSetupHref !== null ? (
          <div
            className="md:col-span-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
            data-testid={`digest-subscription-${form.channelType.toLowerCase()}-setup`}
          >
            <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              {form.connectorReady === false
                ? "Finish connector setup before saving this channel."
                : "Need a webhook URL? Configure the connector first, then paste the incoming webhook URL here."}
            </p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
              <Link className="text-al-link underline-offset-2 hover:underline" href={form.integrationSetupHref}>
                Open {form.channelDisplayLabel(form.channelType)} setup
              </Link>
            </p>
          </div>
        ) : null}

        {form.showDigestType ? (
          <div className="grid gap-1.5">
            <Label htmlFor="digest-subscription-type">Digest type</Label>
            <select
              id="digest-subscription-type"
              value={form.digestType}
              onChange={(event) => form.setDigestType(event.target.value)}
              disabled={!form.canEdit}
              className={cn(
                "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {form.DIGEST_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <Label htmlFor="digest-subscription-enabled">After saving</Label>
          <label
            htmlFor="digest-subscription-enabled"
            className={cn(
              "flex h-9 items-center gap-2 rounded-md border border-neutral-200 px-3 dark:border-neutral-800",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            <input
              id="digest-subscription-enabled"
              type="checkbox"
              checked={form.createEnabled}
              onChange={(event) => form.setCreateEnabled(event.target.checked)}
              disabled={!form.canEdit}
            />
            <span>{form.activationCheckboxLabel(form.createEnabled)}</span>
          </label>
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Enabled subscriptions receive the next scheduled digest once generation runs. This does not send immediately.
          </p>
        </div>
      </div>

      {form.isUnchangedPrefill ? (
        <p
          className={cn("m-0 mt-2 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="digest-subscription-unchanged-prefill"
          role="status"
        >
          Change at least one field to save a new subscription. Existing destinations cannot be updated in place.
        </p>
      ) : null}
    </>
  );
}
