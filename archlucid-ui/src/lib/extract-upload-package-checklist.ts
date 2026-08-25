import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveExtractUploadPackageSteps(input: {
  readonly scenarioSelected: boolean;
  readonly packageUploaded: boolean;
  readonly inventoryParsed: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "scenario",
      label: "Choose demo scenario or source",
      complete: input.scenarioSelected,
    },
    {
      id: "upload",
      label: "Upload extractor zip package",
      complete: input.packageUploaded,
    },
    {
      id: "parse",
      label: "Confirm inventory parsed",
      complete: input.inventoryParsed,
    },
  ];
}

export function resolveExtractUploadPackageEmphasizedStepId(input: {
  readonly scenarioSelected: boolean;
  readonly packageUploaded: boolean;
  readonly inventoryParsed: boolean;
}): string {
  const steps = resolveExtractUploadPackageSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "parse";
}
