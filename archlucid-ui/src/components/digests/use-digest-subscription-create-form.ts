"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useTenantIntegrationsOperationsQuery } from "@/hooks/use-tenant-integrations-operations-query";
import {
  channelDestinationFieldLabel,
  channelDestinationHelper,
  channelDestinationPlaceholder,
  channelDisplayLabel,
  DIGEST_SUBSCRIPTION_CHANNELS,
  DIGEST_TYPE_OPTIONS,
  isDigestSubscriptionFormValid,
  isEmailChannel,
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
  resolveDigestSubscriptionCreateEmphasizedStepId,
  resolveDigestSubscriptionCreateSteps,
} from "@/lib/digest-subscription-create-checklist";
import {
  digestSubscriptionsCreateSubscriptionButtonLabelReaderRank,
} from "@/lib/enterprise-controls-context-copy";
import { whyDisabledEnterpriseMutationControl, whyDisabledIncompleteInput, firstWhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import type { DigestSubscription } from "@/types/digest-subscriptions";
import {
  digestSubscriptionsPanelsHrefFromSearch,
  parseDigestSubscriptionsCreatePanelFromSearch,
} from "@/lib/digests/digest-subscriptions-panels-url";

export type DigestSubscriptionCreateFormProps = {
  readonly existingSubscriptions: readonly DigestSubscription[];
  readonly prefillFrom: DigestSubscription | null;
  readonly canMutate: boolean;
  readonly collapsedByDefault: boolean;
  readonly creating: boolean;
  readonly createSuccess: boolean;
  readonly focusRequestToken?: number;
  readonly onCreate: (input: {
    readonly name: string;
    readonly channelType: string;
    readonly destination: string;
    readonly digestType: string;
    readonly isEnabled: boolean;
  }) => Promise<void>;
};

export function useDigestSubscriptionCreateForm(props: DigestSubscriptionCreateFormProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/architecture/digests";
  const searchParams = useSearchParams();
  const urlShowCreate = parseDigestSubscriptionsCreatePanelFromSearch(searchParams.get("create"));
  const sampleModeBlocked: boolean =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canEdit: boolean = props.canMutate && !sampleModeBlocked;
  const [expanded, setExpandedState] = useState<boolean>(
    () => urlShowCreate || !props.collapsedByDefault,
  );
  const [name, setName] = useState<string>(suggestedSubscriptionName("Email"));
  const [channelType, setChannelType] = useState<string>("Email");
  const [destination, setDestination] = useState<string>("");
  const [digestType, setDigestType] = useState<string>(DIGEST_TYPE_OPTIONS[0].value);
  const [createEnabled, setCreateEnabled] = useState<boolean>(true);
  const [destinationTouched, setDestinationTouched] = useState<boolean>(false);
  const [nameTouched, setNameTouched] = useState<boolean>(false);
  const integrationsQuery = useTenantIntegrationsOperationsQuery();
  const integrationOps = integrationsQuery.data ?? null;

  const syncCreatePanelToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        digestSubscriptionsPanelsHrefFromSearch(searchParams.toString(), { showCreatePanel: open }, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setExpanded = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setExpandedState((prev) => {
        const resolved = typeof value === "function" ? value(prev) : value;
        syncCreatePanelToUrl(resolved);

        return resolved;
      });
    },
    [syncCreatePanelToUrl],
  );

  useEffect(() => {
    if (parseDigestSubscriptionsCreatePanelFromSearch(searchParams.get("create"))) {
      setExpandedState(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (props.collapsedByDefault && !urlShowCreate) {
      setExpandedState(false);
    }
  }, [props.collapsedByDefault, urlShowCreate]);

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

  useEffect(() => {
    if ((props.focusRequestToken ?? 0) === 0) {
      return;
    }

    setExpanded(true);
    document.getElementById("digest-subscription-destination")?.focus();
  }, [props.focusRequestToken]);

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
  const createDisabledHintId = "digest-subscription-create-disabled-hint";
  const createDisabledReason = firstWhyDisabledCtaReason([
    props.canMutate ? null : whyDisabledEnterpriseMutationControl(),
    canEdit && !formValid && destination.trim().length === 0
      ? whyDisabledIncompleteInput("Enter an email address or webhook URL to save this delivery destination.")
      : null,
    canEdit && !formValid && destination.trim().length > 0 && destinationError !== null
      ? whyDisabledIncompleteInput(destinationError)
      : null,
    canEdit && !formValid && integrationBlocksCreate
      ? whyDisabledIncompleteInput("Finish connector setup before saving this channel.")
      : null,
    canEdit && !formValid && isUnchangedPrefill
      ? whyDisabledIncompleteInput("Change at least one field to save a new delivery destination.")
      : null,
  ]);
  const createButtonDescribedBy =
    createDisabledReason === null ? undefined : createDisabledHintId;
  const destinationConfigured =
    channelType.trim().length > 0 &&
    destination.trim().length > 0 &&
    destinationError === null &&
    !integrationBlocksCreate;
  const digestCreateSteps = resolveDigestSubscriptionCreateSteps({
    nameConfigured: name.trim().length > 0,
    destinationConfigured,
    subscriptionSaved: props.createSuccess,
  });
  const digestCreateEmphasizedStepId = resolveDigestSubscriptionCreateEmphasizedStepId({
    nameConfigured: name.trim().length > 0,
    destinationConfigured,
    subscriptionSaved: props.createSuccess,
  });
  const destinationFieldLabel: string = channelDestinationFieldLabel(channelType);
  const destinationLabelText: string = isEmailChannel(channelType)
    ? `${destinationFieldLabel} (required)`
    : destinationFieldLabel;

  const handleChannelTypeChange = (nextChannel: string): void => {
    setChannelType(nextChannel);
    setDestinationTouched(false);

    if (!nameTouched) {
      setName(suggestedSubscriptionName(nextChannel));
    }
  };

  const handleCreate = (): void => {
    void props.onCreate({
      name: name.trim() || suggestedSubscriptionName(channelType),
      channelType,
      destination: destination.trim(),
      digestType,
      isEnabled: createEnabled,
    });
  };

  return {
    sampleModeBlocked,
    canEdit,
    expanded,
    setExpanded,
    name,
    setName,
    channelType,
    destination,
    setDestination,
    digestType,
    setDigestType,
    createEnabled,
    setCreateEnabled,
    destinationTouched,
    setDestinationTouched,
    setNameTouched,
    nameTouched,
    destinationError,
    connectorReady,
    integrationSetupHref,
    integrationBlocksCreate,
    isUnchangedPrefill,
    formValid,
    showDigestType,
    digestTypeLabel,
    createDisabledHintId,
    createDisabledReason,
    createButtonDescribedBy,
    digestCreateSteps,
    digestCreateEmphasizedStepId,
    destinationLabelText,
    handleChannelTypeChange,
    handleCreate,
    activationCheckboxLabel,
    channelDestinationHelper,
    channelDestinationPlaceholder,
    channelDisplayLabel,
    digestSubscriptionsCreateSubscriptionButtonLabelReaderRank,
    DIGEST_SUBSCRIPTION_CHANNELS,
    DIGEST_TYPE_OPTIONS,
    isEmailChannel,
    suggestedSubscriptionName,
    collapsedByDefault: props.collapsedByDefault,
    creating: props.creating,
    createSuccess: props.createSuccess,
    canMutate: props.canMutate,
  };
}

export type DigestSubscriptionCreateFormViewModel = ReturnType<typeof useDigestSubscriptionCreateForm>;
