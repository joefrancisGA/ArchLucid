import {
  AWS_INVENTORY_DEMO_SCENARIOS,
  createAwsInventoryDemoZipFile,
  DEFAULT_AWS_INVENTORY_DEMO_SCENARIO_ID,
  getAwsInventoryDemoScenario,
  getAwsInventoryDemoZipBytes,
  type AwsInventoryDemoScenarioId,
} from "@/lib/arch-lucid-aws-inventory-demo-scenarios";
import {
  AZURE_EXTRACTOR_DEMO_SCENARIOS,
  createAzureExtractorDemoZipFile,
  DEFAULT_DEMO_REVIEW_SCENARIO_ID,
  getAzureExtractorDemoScenario,
  getAzureExtractorDemoZipBytes,
  type DemoReviewScenarioId,
} from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import {
  createGcpInventoryDemoZipFile,
  DEFAULT_GCP_INVENTORY_DEMO_SCENARIO_ID,
  GCP_INVENTORY_DEMO_SCENARIOS,
  getGcpInventoryDemoScenario,
  getGcpInventoryDemoZipBytes,
  type GcpInventoryDemoScenarioId,
} from "@/lib/arch-lucid-gcp-inventory-demo-scenarios";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { cloudInventoryPlatformLabel } from "@/lib/cloud-inventory-platform";
import { readTier1InventoryPackageZipFromBytes } from "@/lib/read-tier1-inventory-package-zip";
import type { WizardFormValues } from "@/lib/wizard-schema";

export type InventoryDemoScenarioId = DemoReviewScenarioId | AwsInventoryDemoScenarioId | GcpInventoryDemoScenarioId;

export type InventoryDemoScenarioSummary = {
  id: InventoryDemoScenarioId;
  title: string;
  subtitle: string;
  resourceCount: number;
};

export function defaultInventoryDemoScenarioId(platform: CloudInventoryPlatform): InventoryDemoScenarioId {
  switch (platform) {
    case "azure":
      return DEFAULT_DEMO_REVIEW_SCENARIO_ID;
    case "aws":
      return DEFAULT_AWS_INVENTORY_DEMO_SCENARIO_ID;
    case "gcp":
      return DEFAULT_GCP_INVENTORY_DEMO_SCENARIO_ID;
    default: {
      const _exhaustive: never = platform;

      return _exhaustive;
    }
  }
}

export function listInventoryDemoScenarios(platform: CloudInventoryPlatform): ReadonlyArray<InventoryDemoScenarioSummary> {
  switch (platform) {
    case "azure":
      return AZURE_EXTRACTOR_DEMO_SCENARIOS.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        subtitle: scenario.subtitle,
        resourceCount: scenario.buildResources().length,
      }));
    case "aws":
      return AWS_INVENTORY_DEMO_SCENARIOS.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        subtitle: scenario.subtitle,
        resourceCount: scenario.buildResources().length,
      }));
    case "gcp":
      return GCP_INVENTORY_DEMO_SCENARIOS.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        subtitle: scenario.subtitle,
        resourceCount: scenario.buildResources().length,
      }));
    default: {
      const _exhaustive: never = platform;

      return _exhaustive;
    }
  }
}

export function inventoryDemoScenarioPickerAriaLabel(platform: CloudInventoryPlatform): string {
  return `${cloudInventoryPlatformLabel(platform)} inventory demo scenarios`;
}

export function getInventoryDemoZipBytes(
  platform: CloudInventoryPlatform,
  scenarioId: InventoryDemoScenarioId,
): Uint8Array {
  switch (platform) {
    case "azure":
      return getAzureExtractorDemoZipBytes(scenarioId as DemoReviewScenarioId);
    case "aws":
      return getAwsInventoryDemoZipBytes(scenarioId as AwsInventoryDemoScenarioId);
    case "gcp":
      return getGcpInventoryDemoZipBytes(scenarioId as GcpInventoryDemoScenarioId);
    default: {
      const _exhaustive: never = platform;

      return _exhaustive;
    }
  }
}

export function createInventoryDemoZipFile(
  platform: CloudInventoryPlatform,
  scenarioId: InventoryDemoScenarioId,
): File {
  switch (platform) {
    case "azure":
      return createAzureExtractorDemoZipFile(scenarioId as DemoReviewScenarioId);
    case "aws":
      return createAwsInventoryDemoZipFile(scenarioId as AwsInventoryDemoScenarioId);
    case "gcp":
      return createGcpInventoryDemoZipFile(scenarioId as GcpInventoryDemoScenarioId);
    default: {
      const _exhaustive: never = platform;

      return _exhaustive;
    }
  }
}

export function buildWizardPrefillFromInventoryDemoScenario(
  platform: CloudInventoryPlatform,
  scenarioId: InventoryDemoScenarioId,
): Partial<Pick<WizardFormValues, "description" | "systemName" | "topologyHints">> {
  switch (platform) {
    case "azure": {
      const scenario = getAzureExtractorDemoScenario(scenarioId as DemoReviewScenarioId);

      return {
        description: scenario.wizardBrief,
        systemName: scenario.systemName,
      };
    }
    case "aws": {
      const scenario = getAwsInventoryDemoScenario(scenarioId as AwsInventoryDemoScenarioId);

      return {
        description: scenario.wizardBrief,
        systemName: scenario.systemName,
      };
    }
    case "gcp": {
      const scenario = getGcpInventoryDemoScenario(scenarioId as GcpInventoryDemoScenarioId);

      return {
        description: scenario.wizardBrief,
        systemName: scenario.systemName,
      };
    }
    default: {
      const _exhaustive: never = platform;

      return _exhaustive;
    }
  }
}

export function validateInventoryDemoZipBytes(
  platform: CloudInventoryPlatform,
  scenarioId: InventoryDemoScenarioId,
): { ok: true } | { ok: false; message: string } {
  const bytes = getInventoryDemoZipBytes(platform, scenarioId);
  const result = readTier1InventoryPackageZipFromBytes(bytes, platform);

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return { ok: true };
}
