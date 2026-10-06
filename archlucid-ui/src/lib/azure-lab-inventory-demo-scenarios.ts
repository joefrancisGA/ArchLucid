import { strToU8, zipSync } from "fflate";

import {
  AZURE_LAB_LANDING_ZONE_DRIFT_RESOURCE_COUNT,
  AZURE_LAB_LANDING_ZONE_RESOURCE_COUNT,
  AZURE_LAB_MESSY_ESTATE_RESOURCE_COUNT,
  buildAzureLabLandingZoneDriftResources,
  buildAzureLabLandingZoneResources,
  buildAzureLabMessyEstateResources,
  type AzureLabInventoryResource,
} from "@/lib/azure-lab-inventory-generator";
import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";

export const AZURE_LAB_DEMO_SCENARIO_IDS = [
  "azure-lab-landing-zone",
  "azure-lab-landing-zone-later",
  "azure-lab-messy-estate",
] as const;

export type AzureLabDemoScenarioId = (typeof AZURE_LAB_DEMO_SCENARIO_IDS)[number];

type AzureLabPolicyCompliance = {
  summary: { total: number; nonCompliant: number; compliant: number };
  states: Array<{ resourceId: string; policyDefinitionName: string; complianceState: string }>;
};

export type AzureLabDemoScenario = {
  id: AzureLabDemoScenarioId;
  title: string;
  subtitle: string;
  systemName: string;
  description: string;
  manifest: ArchLucidAzurePackageManifest;
  zipFilename: string;
  readme: string;
  diagramMermaid: string;
  resourceCount: number;
  buildResources: () => AzureLabInventoryResource[];
  policyCompliance: AzureLabPolicyCompliance;
};

export type AzureLabDemoScenarioSummary = Pick<AzureLabDemoScenario, "id" | "title" | "subtitle" | "resourceCount">;

const landingZoneSubscriptionId = "55555555-5555-5555-5555-555555555555";
const messyEstateSubscriptionId = "66666666-6666-6666-6666-666666666666";

function createManifest(
  scriptVersion: string,
  collectionTimestamp: string,
  subscriptionId: string,
  scope: string,
): ArchLucidAzurePackageManifest {
  return {
    schemaVersion: 1,
    scriptVersion,
    collectionTimestamp,
    subscriptionId,
    scope,
    switchesUsed: [],
  };
}

function createPolicyCompliance(
  resourceIds: string[],
  missingResourceId?: string,
): AzureLabPolicyCompliance {
  const states = missingResourceId
    ? [
        {
          resourceId: missingResourceId,
          policyDefinitionName: "Key Vaults should use private endpoints",
          complianceState: "NonCompliant",
        },
      ]
    : resourceIds.slice(0, 2).map((resourceId, index) => ({
        resourceId,
        policyDefinitionName: index === 0 ? "Key Vaults should have soft delete enabled" : "Storage accounts should restrict network access",
        complianceState: "NonCompliant",
      }));

  return {
    summary: { total: missingResourceId ? 1 : 20, nonCompliant: missingResourceId ? 1 : 2, compliant: missingResourceId ? 0 : 18 },
    states,
  };
}

function buildScenarioZip(scenario: AzureLabDemoScenario): Uint8Array {
  const resources = scenario.buildResources();
  // Lab resources.json is an array because this is the server reader's canonical input shape.
  return zipSync({
    "manifest.json": strToU8(JSON.stringify(scenario.manifest)),
    "resources.json": strToU8(JSON.stringify(resources)),
    "policy-compliance.json": strToU8(JSON.stringify(scenario.policyCompliance)),
    "README.txt": strToU8(scenario.readme),
    "architecture-diagram.mmd": strToU8(scenario.diagramMermaid),
  });
}

const landingZonePolicyIds = [
  `/subscriptions/${landingZoneSubscriptionId}/resourceGroups/lz-connectivity/providers/Microsoft.KeyVault/vaults/kv-lz-connectivity-7`,
  `/subscriptions/${landingZoneSubscriptionId}/resourceGroups/lz-connectivity/providers/Microsoft.Storage/storageAccounts/st-lz-connectivity-8`,
];

export const AZURE_LAB_DEMO_SCENARIOS: ReadonlyArray<AzureLabDemoScenario> = [
  {
    id: "azure-lab-landing-zone",
    title: "Landing zone, 500 resources",
    subtitle: "Sixteen resource groups across eastus and westus2. Synthetic scale sample.",
    systemName: "AzureLabLandingZone",
    description: "Demo Azure lab package — a deterministic 500-resource landing zone scale sample.",
    manifest: createManifest(
      "0.0.0-lab-landing-zone",
      "2026-06-21T12:00:00.000Z",
      landingZoneSubscriptionId,
      `/subscriptions/${landingZoneSubscriptionId}/resourceGroups/lz-connectivity`,
    ),
    zipFilename: "archlucid-lab-landing-zone.zip",
    readme: "Synthetic lab inventory. Not customer evidence.",
    diagramMermaid: "graph TD\n  Connectivity[lz-connectivity] --> Identity[lz-identity]\n  Identity --> Apps[lz-app-01 through lz-app-13]",
    resourceCount: AZURE_LAB_LANDING_ZONE_RESOURCE_COUNT,
    buildResources: buildAzureLabLandingZoneResources,
    policyCompliance: createPolicyCompliance(landingZonePolicyIds),
  },
  {
    id: "azure-lab-landing-zone-later",
    title: "Landing zone, later snapshot",
    subtitle: "Same landing zone with 15 resources removed and 15 added. For drift.",
    systemName: "AzureLabLandingZoneLater",
    description: "Demo Azure lab package — a later deterministic landing zone snapshot for drift.",
    manifest: createManifest(
      "0.0.0-lab-landing-zone-later",
      "2026-06-22T12:00:00.000Z",
      landingZoneSubscriptionId,
      `/subscriptions/${landingZoneSubscriptionId}/resourceGroups/lz-connectivity`,
    ),
    zipFilename: "archlucid-lab-landing-zone-later.zip",
    readme: "Synthetic lab inventory. Not customer evidence.\nLater snapshot of the landing zone lab pack.",
    diagramMermaid: "graph TD\n  Connectivity[lz-connectivity] --> Identity[lz-identity]\n  Identity --> NewApps[lz-app-new]",
    resourceCount: AZURE_LAB_LANDING_ZONE_DRIFT_RESOURCE_COUNT,
    buildResources: buildAzureLabLandingZoneDriftResources,
    policyCompliance: createPolicyCompliance(landingZonePolicyIds),
  },
  {
    id: "azure-lab-messy-estate",
    title: "Messy estate",
    subtitle: "Duplicate names, an unknown type, and a policy row for a missing resource. Expected to look incomplete.",
    systemName: "MessyPrimaryRg",
    description: "Demo Azure lab package — a deliberately irregular estate for parser and review testing.",
    manifest: createManifest(
      "0.0.0-lab-messy-estate",
      "2026-06-21T12:30:00.000Z",
      messyEstateSubscriptionId,
      `/subscriptions/${messyEstateSubscriptionId}/resourceGroups/MessyPrimaryRg`,
    ),
    zipFilename: "archlucid-lab-messy-estate.zip",
    readme: "Synthetic lab inventory. Not customer evidence.\nExpected to look incomplete.",
    diagramMermaid: "graph TD\n  Primary[MessyPrimaryRg] --> Secondary[MessySecondaryRg]\n  Primary -. missing target .-> PrivateEndpoint[pe-missing-target-1]",
    resourceCount: AZURE_LAB_MESSY_ESTATE_RESOURCE_COUNT,
    buildResources: buildAzureLabMessyEstateResources,
    policyCompliance: createPolicyCompliance([], `/subscriptions/${messyEstateSubscriptionId}/resourceGroups/MissingRg/providers/Microsoft.KeyVault/vaults/does-not-exist`),
  },
];

const scenarioById = new Map(AZURE_LAB_DEMO_SCENARIOS.map((scenario) => [scenario.id, scenario]));
const zipBytesCache = new Map<AzureLabDemoScenarioId, Uint8Array>();

export function isAzureLabDemoScenarioId(value: string | null | undefined): value is AzureLabDemoScenarioId {
  return value !== null && value !== undefined && scenarioById.has(value as AzureLabDemoScenarioId);
}

export function getAzureLabDemoScenario(scenarioId: AzureLabDemoScenarioId): AzureLabDemoScenario {
  const scenario = scenarioById.get(scenarioId);

  if (scenario === undefined) {
    throw new Error(`Unknown Azure lab demo scenario: ${scenarioId}`);
  }

  return scenario;
}

export function listAzureLabDemoScenarioSummaries(): ReadonlyArray<AzureLabDemoScenarioSummary> {
  return AZURE_LAB_DEMO_SCENARIOS.map(({ id, title, subtitle, resourceCount }) => ({
    id,
    title,
    subtitle,
    resourceCount,
  }));
}

export function getAzureLabDemoZipBytes(scenarioId: AzureLabDemoScenarioId): Uint8Array {
  const cached = zipBytesCache.get(scenarioId);

  if (cached !== undefined) {
    return cached;
  }

  const bytes = buildScenarioZip(getAzureLabDemoScenario(scenarioId));
  zipBytesCache.set(scenarioId, bytes);

  return bytes;
}

export function createAzureLabDemoZipFile(scenarioId: AzureLabDemoScenarioId): File {
  const scenario = getAzureLabDemoScenario(scenarioId);

  return new File([new Uint8Array(getAzureLabDemoZipBytes(scenarioId))], scenario.zipFilename, {
    type: "application/zip",
  });
}
