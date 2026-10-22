import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export function resolveExtractUploadPackageSteps(input: {
  readonly packageAccepted: boolean;
  readonly inventoryParsed: boolean;
  readonly replacingInventory?: boolean;
}): readonly IntegrationConnectChecklistStep[] {
  const uploadComplete =
    input.packageAccepted ||
    (input.inventoryParsed && input.replacingInventory !== true);

  return [
    {
      id: "upload",
      label: "Upload Azure inventory package",
      complete: uploadComplete,
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
  readonly replacingInventory?: boolean;
}): string {
  const steps = resolveExtractUploadPackageSteps(input);
  const incomplete = steps.find((step) => !step.complete);

  return incomplete?.id ?? "parse";
}

/** The accepted-package panel already confirms a finished upload; keep the checklist only while a step is open. */
export function shouldShowExtractUploadPackageChecklist(
  hasAcceptedPackage: boolean,
  steps: readonly IntegrationConnectChecklistStep[] | null | undefined,
): boolean {
  if (!hasAcceptedPackage || steps == null) {
    return true;
  }

  return steps.some((step) => !step.complete);
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
