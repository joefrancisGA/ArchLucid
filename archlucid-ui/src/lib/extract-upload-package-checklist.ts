import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveExtractUploadPackageSteps(input: {
  readonly packageAccepted: boolean;
  readonly inventoryParsed: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  return [
    {
      id: "upload",
      label: "Upload architecture package",
      complete: input.packageAccepted,
    },
    {
      id: "parse",
      label: "Confirm inventory on file",
      complete: input.inventoryParsed,
    },
  ];
}

export function resolveExtractUploadPackageEmphasizedStepId(input: {
  readonly packageAccepted: boolean;
  readonly inventoryParsed: boolean;
}): string {
  const steps = resolveExtractUploadPackageSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "parse";
}

export function resolveExtractUploadHasInventoryOnFile(input: {
  readonly hasBaselineArtifacts: boolean | null;
  readonly packageId: string | null;
}): boolean | null {
  if (input.hasBaselineArtifacts === true || input.packageId !== null) {
    return true;
  }

  if (input.hasBaselineArtifacts === false) {
    return false;
  }

  return null;
}
