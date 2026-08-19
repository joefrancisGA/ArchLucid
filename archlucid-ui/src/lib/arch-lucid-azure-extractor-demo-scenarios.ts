import { strToU8, zipSync } from "fflate";

import { buildWizardPrefillFromArchLucidAzureManifest } from "@/lib/apply-arch-lucid-azure-package-manifest-to-wizard";
import type { ArchLucidAzurePackageManifest } from "@/lib/arch-lucid-azure-package-manifest";
import type { WizardFormValues } from "@/lib/wizard-schema";

export const AZURE_EXTRACTOR_DEMO_SCENARIO_IDS = [
  "customer-intake-modernization",
  "multi-region-saas-platform",
  "finops-optimization-snapshot",
] as const;

export type DemoReviewScenarioId = (typeof AZURE_EXTRACTOR_DEMO_SCENARIO_IDS)[number];

/** @deprecated Prefer {@link DemoReviewScenarioId} — Azure-only name retained for legacy imports. */
export type AzureExtractorDemoScenarioId = DemoReviewScenarioId;

export const DEFAULT_DEMO_REVIEW_SCENARIO_ID: DemoReviewScenarioId = "customer-intake-modernization";

/** @deprecated Prefer {@link DEFAULT_DEMO_REVIEW_SCENARIO_ID} — Azure-only name retained for legacy imports. */
export const DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID = DEFAULT_DEMO_REVIEW_SCENARIO_ID;

type DemoResourceRecord = {
  name: string;
  type: string;
  location: string;
  resourceGroup: string;
};

type DemoResourceTemplate = {
  prefix: string;
  type: string;
  count: number;
};

export type AzureExtractorDemoScenario = {
  id: AzureExtractorDemoScenarioId;
  title: string;
  subtitle: string;
  systemName: string;
  wizardBrief: string;
  manifest: ArchLucidAzurePackageManifest;
  zipFilename: string;
  readme: string;
  diagramMermaid: string;
  buildResources: () => DemoResourceRecord[];
  policyCompliance: {
    summary: { total: number; nonCompliant: number; compliant: number };
    states: Array<{ resourceId: string; policyDefinitionName: string; complianceState: string }>;
  };
};

function expandResourceTemplates(
  resourceGroup: string,
  location: string,
  templates: ReadonlyArray<DemoResourceTemplate>,
): DemoResourceRecord[] {
  const resources: DemoResourceRecord[] = [];

  for (const template of templates) {
    for (let index = 1; index <= template.count; index += 1) {
      resources.push({
        name: `${template.prefix}${index}`,
        type: template.type,
        location,
        resourceGroup,
      });
    }
  }

  return resources;
}

function buildClaimsIntakeResources(): DemoResourceRecord[] {
  const resourceGroup = "ClaimsIntakeRg";
  const location = "eastus";

  return expandResourceTemplates(resourceGroup, location, [
    { prefix: "claims-api-", type: "Microsoft.Web/sites", count: 3 },
    { prefix: "claims-fn-", type: "Microsoft.Web/sites", count: 2 },
    { prefix: "claims-sql-", type: "Microsoft.Sql/servers/databases", count: 2 },
    { prefix: "claims-kv-", type: "Microsoft.KeyVault/vaults", count: 2 },
    { prefix: "claims-st-", type: "Microsoft.Storage/storageAccounts", count: 3 },
    { prefix: "claims-sb-", type: "Microsoft.ServiceBus/namespaces", count: 1 },
    { prefix: "claims-ai-", type: "Microsoft.Insights/components", count: 2 },
    { prefix: "claims-vnet-", type: "Microsoft.Network/virtualNetworks", count: 1 },
    { prefix: "claims-pe-", type: "Microsoft.Network/privateEndpoints", count: 4 },
    { prefix: "claims-apim-", type: "Microsoft.ApiManagement/service", count: 1 },
  ]);
}

function buildMultiRegionSaasResources(): DemoResourceRecord[] {
  const primary = expandResourceTemplates("SaaSPlatformPrimary", "eastus", [
    { prefix: "saas-agw-", type: "Microsoft.Network/applicationGateways", count: 1 },
    { prefix: "saas-aks-", type: "Microsoft.ContainerService/managedClusters", count: 1 },
    { prefix: "saas-sql-", type: "Microsoft.Sql/servers/databases", count: 2 },
    { prefix: "saas-redis-", type: "Microsoft.Cache/Redis", count: 1 },
    { prefix: "saas-kv-", type: "Microsoft.KeyVault/vaults", count: 1 },
    { prefix: "saas-cdn-", type: "Microsoft.Cdn/profiles", count: 1 },
    { prefix: "saas-app-", type: "Microsoft.Web/sites", count: 4 },
    { prefix: "saas-log-", type: "Microsoft.OperationalInsights/workspaces", count: 1 },
  ]);

  const secondary = expandResourceTemplates("SaaSPlatformSecondary", "westus2", [
    { prefix: "saas-dr-aks-", type: "Microsoft.ContainerService/managedClusters", count: 1 },
    { prefix: "saas-dr-sql-", type: "Microsoft.Sql/servers/databases", count: 2 },
    { prefix: "saas-dr-kv-", type: "Microsoft.KeyVault/vaults", count: 1 },
    { prefix: "saas-dr-app-", type: "Microsoft.Web/sites", count: 3 },
    { prefix: "saas-dr-pe-", type: "Microsoft.Network/privateEndpoints", count: 3 },
    { prefix: "saas-dr-traffic-", type: "Microsoft.Network/trafficManagerProfiles", count: 1 },
  ]);

  return [...primary, ...secondary];
}

function buildFinOpsResources(): DemoResourceRecord[] {
  const resourceGroup = "FinOpsSnapshotRg";
  const location = "eastus";

  return expandResourceTemplates(resourceGroup, location, [
    { prefix: "idle-vm-", type: "Microsoft.Compute/virtualMachines", count: 6 },
    { prefix: "orphan-disk-", type: "Microsoft.Compute/disks", count: 8 },
    { prefix: "unused-pip-", type: "Microsoft.Network/publicIPAddresses", count: 5 },
    { prefix: "oversized-sql-", type: "Microsoft.Sql/servers/databases", count: 3 },
    { prefix: "legacy-app-", type: "Microsoft.Web/sites", count: 4 },
    { prefix: "cold-st-", type: "Microsoft.Storage/storageAccounts", count: 4 },
    { prefix: "idle-lb-", type: "Microsoft.Network/loadBalancers", count: 2 },
  ]);
}

export const AZURE_EXTRACTOR_DEMO_SCENARIOS: ReadonlyArray<AzureExtractorDemoScenario> = [
  {
    id: "customer-intake-modernization",
    title: "Customer intake modernization",
    subtitle: "Regulated healthcare-style web + data plane with PHI-adjacent controls.",
    systemName: "ClaimsIntakeRg",
    wizardBrief:
      "Demo Azure extractor package — claims intake modernization (regulated workload). " +
      "Use to preview review output before InfoSec approves Get-ArchLucidAzurePackage.ps1.",
    manifest: {
      schemaVersion: 1,
      scriptVersion: "0.2.0-demo-claims",
      collectionTimestamp: "2026-06-20T12:00:00.000Z",
      subscriptionId: "22222222-2222-2222-2222-222222222222",
      scope:
        "/subscriptions/22222222-2222-2222-2222-222222222222/resourceGroups/ClaimsIntakeRg",
      switchesUsed: ["IncludePolicy", "IncludeRetailPrices"],
    },
    zipFilename: "archlucid-demo-claims-intake.zip",
    readme:
      "ArchLucid bundled demo — claims intake modernization. Sanitized synthetic inventory; not customer evidence.",
    diagramMermaid:
      "graph TD\n  APIM[API Management] --> Web[App Services]\n  Web --> SQL[Azure SQL]\n  Web --> KV[Key Vault]\n  Web --> SB[Service Bus]\n  PE[Private Endpoints] --> SQL",
    buildResources: buildClaimsIntakeResources,
    policyCompliance: {
      summary: { total: 14, nonCompliant: 4, compliant: 10 },
      states: [
        {
          resourceId: "/.../ClaimsIntakeRg/providers/Microsoft.KeyVault/vaults/claims-kv-1",
          policyDefinitionName: "Require soft delete on Key Vault",
          complianceState: "NonCompliant",
        },
        {
          resourceId: "/.../ClaimsIntakeRg/providers/Microsoft.Storage/storageAccounts/claims-st-2",
          policyDefinitionName: "Storage accounts should restrict network access",
          complianceState: "NonCompliant",
        },
      ],
    },
  },
  {
    id: "multi-region-saas-platform",
    title: "Multi-region SaaS platform",
    subtitle: "Primary + DR regions with AKS, SQL geo-pairs, and traffic routing.",
    systemName: "SaaSPlatformPrimary",
    wizardBrief:
      "Demo Azure extractor package — multi-region SaaS platform spanning eastus and westus2. " +
      "Stress-tests architecture structure and resilience findings without running the live extractor script.",
    manifest: {
      schemaVersion: 1,
      scriptVersion: "0.2.0-demo-saas",
      collectionTimestamp: "2026-06-20T12:05:00.000Z",
      subscriptionId: "33333333-3333-3333-3333-333333333333",
      scope:
        "/subscriptions/33333333-3333-3333-3333-333333333333/resourceGroups/SaaSPlatformPrimary",
      switchesUsed: ["IncludePolicy"],
    },
    zipFilename: "archlucid-demo-multi-region-saas.zip",
    readme:
      "ArchLucid bundled demo — multi-region SaaS platform. Synthetic cross-region inventory for evaluation only.",
    diagramMermaid:
      "graph LR\n  TM[Traffic Manager] --> AGW[App Gateway eastus]\n  AGW --> AKS[AKS Primary]\n  AKS --> SQLP[SQL Primary]\n  TM --> DR[AKS DR westus2]\n  DR --> SQLD[SQL DR]",
    buildResources: buildMultiRegionSaasResources,
    policyCompliance: {
      summary: { total: 18, nonCompliant: 3, compliant: 15 },
      states: [
        {
          resourceId: "/.../SaaSPlatformPrimary/providers/Microsoft.ContainerService/managedClusters/saas-aks-1",
          policyDefinitionName: "AKS clusters should have Azure Policy add-on enabled",
          complianceState: "NonCompliant",
        },
      ],
    },
  },
  {
    id: "finops-optimization-snapshot",
    title: "FinOps optimization snapshot",
    subtitle: "Idle VMs, orphaned disks, and oversized databases for cost findings.",
    systemName: "FinOpsSnapshotRg",
    wizardBrief:
      "Demo Azure extractor package — FinOps optimization snapshot with idle and orphaned resources. " +
      "Preview cost-oriented findings before uploading production inventory.",
    manifest: {
      schemaVersion: 1,
      scriptVersion: "0.2.0-demo-finops",
      collectionTimestamp: "2026-06-20T12:10:00.000Z",
      subscriptionId: "44444444-4444-4444-4444-444444444444",
      scope:
        "/subscriptions/44444444-4444-4444-4444-444444444444/resourceGroups/FinOpsSnapshotRg",
      switchesUsed: ["IncludeCost", "IncludeRetailPrices"],
    },
    zipFilename: "archlucid-demo-finops-snapshot.zip",
    readme:
      "ArchLucid bundled demo — FinOps optimization snapshot. Illustrative waste patterns; not audited spend data.",
    diagramMermaid:
      "graph TD\n  IdleVMs[Idle VMs x6] --> OrphanDisks[Orphan disks x8]\n  UnusedPIPs[Unused public IPs x5] --> OversizedSQL[Oversized SQL x3]",
    buildResources: buildFinOpsResources,
    policyCompliance: {
      summary: { total: 10, nonCompliant: 2, compliant: 8 },
      states: [
        {
          resourceId: "/.../FinOpsSnapshotRg/providers/Microsoft.Compute/virtualMachines/idle-vm-3",
          policyDefinitionName: "Machines should be managed by Azure Arc",
          complianceState: "NonCompliant",
        },
      ],
    },
  },
];

const scenarioById = new Map(AZURE_EXTRACTOR_DEMO_SCENARIOS.map((scenario) => [scenario.id, scenario]));

const zipBytesCache = new Map<AzureExtractorDemoScenarioId, Uint8Array>();

export function isAzureExtractorDemoScenarioId(value: string | null | undefined): value is AzureExtractorDemoScenarioId {
  if (value === null || value === undefined) {
    return false;
  }

  return scenarioById.has(value as AzureExtractorDemoScenarioId);
}

export function resolveAzureExtractorDemoScenarioId(
  raw: string | null | undefined,
): AzureExtractorDemoScenarioId {
  const value = raw?.trim() ?? "";

  if (value === "claims-intake-modernization") {
    return "customer-intake-modernization";
  }

  if (isAzureExtractorDemoScenarioId(value)) {
    return value as AzureExtractorDemoScenarioId;
  }

  return DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID;
}

export function getAzureExtractorDemoScenario(
  scenarioId: AzureExtractorDemoScenarioId = DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
): AzureExtractorDemoScenario {
  const scenario = scenarioById.get(scenarioId);

  if (scenario === undefined) {
    throw new Error(`Unknown Azure extractor demo scenario: ${scenarioId}`);
  }

  return scenario;
}

export function buildWizardPrefillFromDemoScenario(
  scenario: AzureExtractorDemoScenario,
): Partial<Pick<WizardFormValues, "description" | "systemName" | "topologyHints">> {
  const manifestPrefill = buildWizardPrefillFromArchLucidAzureManifest(scenario.manifest);

  return {
    ...manifestPrefill,
    description: scenario.wizardBrief,
    systemName: scenario.systemName,
  };
}

export function getAzureExtractorDemoZipBytes(
  scenarioId: AzureExtractorDemoScenarioId = DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
): Uint8Array {
  const cached = zipBytesCache.get(scenarioId);

  if (cached !== undefined) {
    return cached;
  }

  const scenario = getAzureExtractorDemoScenario(scenarioId);
  const resources = { resources: scenario.buildResources() };
  const bytes = zipSync({
    "manifest.json": strToU8(JSON.stringify(scenario.manifest)),
    "resources.json": strToU8(JSON.stringify(resources)),
    "policy-compliance.json": strToU8(JSON.stringify(scenario.policyCompliance)),
    "README.txt": strToU8(scenario.readme),
    "architecture-diagram.mmd": strToU8(scenario.diagramMermaid),
  });

  zipBytesCache.set(scenarioId, bytes);

  return bytes;
}

export function createAzureExtractorDemoZipFile(
  scenarioId: AzureExtractorDemoScenarioId = DEFAULT_AZURE_EXTRACTOR_DEMO_SCENARIO_ID,
): File {
  const scenario = getAzureExtractorDemoScenario(scenarioId);
  const bytes = getAzureExtractorDemoZipBytes(scenarioId);

  return new File([Uint8Array.from(bytes)], scenario.zipFilename, {
    type: "application/zip",
  });
}
