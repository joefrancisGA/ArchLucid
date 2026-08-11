"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import { DigestPreviewBeforeSubscribePanel } from "@/components/digests/DigestPreviewBeforeSubscribePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  channelDestinationFieldLabel,
  channelDestinationHelper,
  channelDestinationPlaceholder,
  channelDisplayLabel,
  DIGEST_SUBSCRIPTION_CHANNELS,
  DIGEST_TYPE_OPTIONS,
  isDigestSubscriptionFormValid,
  validateDigestSubscriptionDestination,
} from "@/lib/digest-subscription-form";
import {
  activationCheckboxLabel,
  channelIntegrationSetupHref,
  isDuplicateEmailDestination,
  parseDigestTypeFromMetadata,
  resolveConnectorReadyForChannel,
  shouldShowDigestTypeSelector,
  suggestedSubscriptionName,
} from "@/lib/digest-subscriptions-workflow";
import {
  digestSubscriptionsCreateSubscriptionButtonLabelReaderRank,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import { fetchTenantIntegrationsOperations } from "@/lib/api/tenant-customer-success";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import type { DigestSubscription } from "@/types/digest-subscriptions";
import type { TenantIntegrationsOperationsDto } from "@/types/operate-rhythm";

export type DigestSubscriptionCreateFormProps = {
  readonly existingSubscriptions: readonly DigestSubscription[];
  readonly prefillFrom: DigestSubscription | null;
  readonly canMutate: boolean;
  readonly collapsedByDefault: boolean;
  readonly creating: boolean;
  readonly createSuccess: boolean;
  readonly onCreate: (input: {
    readonly name: string;
    readonly channelType: string;
    readonly destination: string;
    readonly digestType: string;
    readonly isEnabled: boolean;
  }) => Promise<void>;
};

export function DigestSubscriptionCreateForm(props: DigestSubscriptionCreateFormProps): ReactElement {
  const sampleModeBlocked: boolean =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canEdit: boolean = props.canMutate && !sampleModeBlocked;
  const [expanded, setExpanded] = useState<boolean>(!props.collapsedByDefault);
  const [name, setName] = useState<string>(suggestedSubscriptionName("Email"));
  const [channelType, setChannelType] = useState<string>("Email");
  const [destination, setDestination] = useState<string>("");
  const [digestType, setDigestType] = useState<string>(DIGEST_TYPE_OPTIONS[0].value);
  const [createEnabled, setCreateEnabled] = useState<boolean>(true);
  const [destinationTouched, setDestinationTouched] = useState<boolean>(false);
  const [nameTouched, setNameTouched] = useState<boolean>(false);
  const [integrationOps, setIntegrationOps] = useState<TenantIntegrationsOperationsDto | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchTenantIntegrationsOperations()
      .then((data) => {
        if (!cancelled) {
          setIntegrationOps(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIntegrationOps(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (props.collapsedByDefault) {
      setExpanded(false);
    }
  }, [props.collapsedByDefault]);

  useEffect(() => {
    if (props.prefillFrom === null) {
      return;
    }

    setExpanded(true);
    setName(props.prefillFrom.name);
    setChannelType(props.prefillFrom.channelType);
    setDestination(props.prefillFrom.destination);
    setDigestType(parseDigestTypeFromMetadata(props.prefillFrom.metadataJson));
    setCreateEnabled(props.prefillFrom.isEnabled);
    setNameTouched(true);
    setDestinationTouched(false);
  }, [props.prefillFrom]);

  const destinationError: string | null = useMemo(() => {
    const validationError: string | null = validateDigestSubscriptionDestination(channelType, destination);

    if (validationError !== null) {
      return validationError;
    }

    if (isDuplicateEmailDestination(props.existingSubscriptions, destination, props.prefillFrom?.subscriptionId)) {
      return "This email address already has an active subscription.";
    }

    return null;
  }, [channelType, destination, props.existingSubscriptions, props.prefillFrom?.subscriptionId]);

  const connectorReady: boolean | null = resolveConnectorReadyForChannel(integrationOps, channelType);
  const integrationSetupHref: string | null = channelIntegrationSetupHref(channelType);
  const integrationBlocksCreate: boolean =
    integrationSetupHref !== null && connectorReady === false;

  const isUnchangedPrefill: boolean = useMemo(() => {
    if (props.prefillFrom === null) {
      return false;
    }

    return (
      props.prefillFrom.name === name.trim() &&
      props.prefillFrom.channelType === channelType &&
      props.prefillFrom.destination.trim() === destination.trim() &&
      props.prefillFrom.isEnabled === createEnabled
    );
  }, [props.prefillFrom, name, channelType, destination, createEnabled]);

  const formValid: boolean =
    isDigestSubscriptionFormValid({ name, channelType, destination }) &&
    destinationError === null &&
    !integrationBlocksCreate &&
    !isUnchangedPrefill;

  const showDigestType: boolean = shouldShowDigestTypeSelector();
  const digestTypeLabel: string =
    DIGEST_TYPE_OPTIONS.find((option) => option.value === digestType)?.label ?? "Architecture digest";

  if (!expanded) {
    return (
      <section
        className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
        data-testid="digest-subscription-create-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            Add delivery destination
          </h3>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={() => setExpanded(true)}
            disabled={!canEdit}
            title={canEdit ? undefined : enterpriseMutationControlDisabledTitle}
          >
            {canEdit ? "Create subscription" : digestSubscriptionsCreateSubscriptionButtonLabelReaderRank}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="digest-subscription-create-card"
    >
      <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {props.collapsedByDefault ? "Add delivery destination" : "New delivery destination"}
      </h3>

      {sampleModeBlocked ? (
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

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="digest-subscription-name">Delivery name</Label>
          <Input
            id="digest-subscription-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => setNameTouched(true)}
            placeholder={suggestedSubscriptionName(channelType)}
            readOnly={!canEdit}
            title={canEdit ? undefined : enterpriseMutationControlDisabledTitle}
          />
          {!nameTouched && name.trim().length === 0 ? (
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              A short label so your team can recognize this destination later.
            </p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="digest-subscription-channel">Channel</Label>
          <select
            id="digest-subscription-channel"
            value={channelType}
            onChange={(event) => {
              const nextChannel: string = event.target.value;
              setChannelType(nextChannel);
              setDestinationTouched(false);

              if (!nameTouched) {
                setName(suggestedSubscriptionName(nextChannel));
              }
            }}
            disabled={!canEdit}
            title={canEdit ? undefined : enterpriseMutationControlDisabledTitle}
            className={cn(
              "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            {DIGEST_SUBSCRIPTION_CHANNELS.map((channel) => (
              <option key={channel} value={channel}>
                {channelDisplayLabel(channel)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5 md:col-span-2">
          <Label htmlFor="digest-subscription-destination">{channelDestinationFieldLabel(channelType)}</Label>
          <Input
            id="digest-subscription-destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            onBlur={() => setDestinationTouched(true)}
            placeholder={channelDestinationPlaceholder(channelType)}
            readOnly={!canEdit}
            title={canEdit ? undefined : enterpriseMutationControlDisabledTitle}
            aria-invalid={destinationTouched && destinationError !== null}
            aria-describedby="digest-subscription-destination-help"
          />
          <p
            id="digest-subscription-destination-help"
            className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          >
            {channelDestinationHelper(channelType)}
          </p>
          {destinationTouched && destinationError !== null ? (
            <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
              {destinationError}
            </p>
          ) : null}
        </div>

        {integrationSetupHref !== null ? (
          <div
            className="md:col-span-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900"
            data-testid={`digest-subscription-${channelType.toLowerCase()}-setup`}
          >
            <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              {connectorReady === false
                ? "Finish connector setup before saving this channel."
                : "Need a webhook URL? Configure the connector first, then paste the incoming webhook URL here."}
            </p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
              <Link className="text-al-link underline-offset-2 hover:underline" href={integrationSetupHref}>
                Open {channelDisplayLabel(channelType)} setup
              </Link>
            </p>
          </div>
        ) : null}

        {showDigestType ? (
          <div className="grid gap-1.5">
            <Label htmlFor="digest-subscription-type">Digest type</Label>
            <select
              id="digest-subscription-type"
              value={digestType}
              onChange={(event) => setDigestType(event.target.value)}
              disabled={!canEdit}
              title={canEdit ? undefined : enterpriseMutationControlDisabledTitle}
              className={cn(
                "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800",
                OPERATOR_TYPOGRAPHY.body,
              )}
            >
              {DIGEST_TYPE_OPTIONS.map((option) => (
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
              checked={createEnabled}
              onChange={(event) => setCreateEnabled(event.target.checked)}
              disabled={!canEdit}
              title={canEdit ? undefined : enterpriseMutationControlDisabledTitle}
            />
            <span>{activationCheckboxLabel(createEnabled)}</span>
          </label>
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Enabled subscriptions receive the next scheduled digest once generation runs. This does not send immediately.
          </p>
        </div>
      </div>

      {isUnchangedPrefill ? (
        <p
          className={cn("m-0 mt-2 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="digest-subscription-unchanged-prefill"
          role="status"
        >
          Change at least one field to save a new subscription. Existing destinations cannot be updated in place.
        </p>
      ) : null}

      <DigestPreviewBeforeSubscribePanel
        className="mt-3"
        variant="architecture-subscription"
        subscriptionName={name}
        channelType={channelType}
        destination={destination}
        digestTypeLabel={digestTypeLabel}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() =>
            void props.onCreate({
              name: name.trim() || suggestedSubscriptionName(channelType),
              channelType,
              destination: destination.trim(),
              digestType,
              isEnabled: createEnabled,
            })
          }
          disabled={!formValid || props.creating || !canEdit}
          title={canEdit ? undefined : enterpriseMutationControlDisabledTitle}
          data-testid="digest-subscription-create-button"
        >
          {props.creating
            ? "Saving…"
            : canEdit
              ? "Save subscription"
              : digestSubscriptionsCreateSubscriptionButtonLabelReaderRank}
        </Button>
        {props.createSuccess ? (
          <span
            className={cn("text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="digest-subscription-create-success"
            role="status"
          >
            Subscription saved
          </span>
        ) : null}
      </div>
    </section>
  );
}
