import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolvePreferencesSaveSteps(input: {
  readonly appearanceConfigured: boolean;
  readonly localeScopeSaved: boolean;
  readonly followUpPreferencesSaved: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "appearance",
      label: "Choose appearance theme",
      complete: input.appearanceConfigured,
    },
    {
      id: "locale",
      label: "Save time zone and cloud platform scope",
      complete: input.localeScopeSaved,
    },
    {
      id: "follow-up",
      label: "Save follow-up and overview preferences",
      complete: input.followUpPreferencesSaved,
    },
  ];
}

export function resolvePreferencesSaveEmphasizedStepId(input: {
  readonly appearanceConfigured: boolean;
  readonly localeScopeSaved: boolean;
  readonly followUpPreferencesSaved: boolean;
}): string {
  const steps = resolvePreferencesSaveSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "follow-up";
}
