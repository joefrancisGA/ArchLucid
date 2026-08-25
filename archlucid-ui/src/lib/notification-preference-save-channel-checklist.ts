import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveNotificationPreferenceSaveChannelSteps(input: {
  readonly channelsReviewed: boolean;
  readonly primaryChannelsReady: boolean;
  readonly allChannelsReady: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "review",
      label: "Review each notification channel status",
      complete: input.channelsReviewed,
    },
    {
      id: "primary",
      label: "Save primary channel configuration",
      complete: input.primaryChannelsReady,
    },
    {
      id: "all",
      label: "Confirm all channels are connected",
      complete: input.allChannelsReady,
    },
  ];
}

export function resolveNotificationPreferenceSaveChannelEmphasizedStepId(input: {
  readonly channelsReviewed: boolean;
  readonly primaryChannelsReady: boolean;
  readonly allChannelsReady: boolean;
}): string {
  const steps = resolveNotificationPreferenceSaveChannelSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "all";
}
