import type { AzureBoardsIntegrationHealthResponse } from "@/lib/api/azure-boards-api";
import {
  AZURE_BOARDS_SETUP_STEP_CURRENT_LABEL,
  AZURE_BOARDS_SETUP_STEP_DONE_LABEL,
  AZURE_BOARDS_SETUP_STEP_PENDING_LABEL,
} from "@/lib/azure-boards-page-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { findingsPathForProductLine } from "@/lib/product-line/securenow-compliance-routes";

export type AzureBoardsSetupStep = {
  readonly id: string;
  readonly label: string;
  readonly complete: boolean;
  readonly href?: string;
};

export function resolveAzureBoardsSetupSteps(input: {
  readonly nativeEnabled: boolean;
  readonly credentialsReady: boolean;
  readonly settingsReady: boolean;
  readonly health: AzureBoardsIntegrationHealthResponse | null | undefined;
  readonly productLine?: ProductLineId;
}): readonly AzureBoardsSetupStep[] {
  const findingsHref = findingsPathForProductLine(input.productLine ?? "architecture");

  return [
    {
      id: "credentials",
      label: "Organization URL and secure token reference",
      complete: input.credentialsReady,
      href: "#azure-boards-connection-settings",
    },
    {
      id: "defaults",
      label: "Default project and work item type",
      complete: input.settingsReady,
      href: "#azure-boards-default-behavior-heading",
    },
    {
      id: "verify",
      label: "Successful connection test",
      complete: input.health?.reachable === true,
      href: "#azure-boards-test-heading",
    },
    {
      id: "create",
      label: "Create work items from findings",
      complete: input.nativeEnabled && input.health?.reachable === true && input.settingsReady,
      href: findingsHref,
    },
  ];
}

export function resolveAzureBoardsSetupStepTagLabel(
  step: AzureBoardsSetupStep,
  emphasizedSetupStepId: string,
): string {
  if (step.complete) {
    return AZURE_BOARDS_SETUP_STEP_DONE_LABEL;
  }

  if (step.id === emphasizedSetupStepId) {
    return AZURE_BOARDS_SETUP_STEP_CURRENT_LABEL;
  }

  return AZURE_BOARDS_SETUP_STEP_PENDING_LABEL;
}
