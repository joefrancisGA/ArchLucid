import { strToU8, zipSync } from "fflate";

import type { ArchLucidGcpInventoryPackageManifest } from "@/lib/arch-lucid-cloud-inventory-package-manifest";
import type { WizardFormValues } from "@/lib/wizard-schema";

export const GCP_INVENTORY_DEMO_SCENARIO_IDS = [
  "claims-intake-modernization",
  "multi-region-saas-platform",
  "finops-optimization-snapshot",
] as const;

export type GcpInventoryDemoScenarioId = (typeof GCP_INVENTORY_DEMO_SCENARIO_IDS)[number];

export const DEFAULT_GCP_INVENTORY_DEMO_SCENARIO_ID: GcpInventoryDemoScenarioId =
  "claims-intake-modernization";

type GcpDemoResourceRecord = {
  name: string;
  type: string;
  location: string;
  projectId: string;
};

type GcpDemoResourceTemplate = {
  prefix: string;
  type: string;
  count: number;
  location?: string;
};

export type GcpInventoryDemoScenario = {
  id: GcpInventoryDemoScenarioId;
  title: string;
  subtitle: string;
  systemName: string;
  wizardBrief: string;
  manifest: ArchLucidGcpInventoryPackageManifest;
  zipFilename: string;
  readme: string;
  buildResources: () => GcpDemoResourceRecord[];
};

function expandGcpResourceTemplates(
  projectId: string,
  location: string,
  templates: ReadonlyArray<GcpDemoResourceTemplate>,
): GcpDemoResourceRecord[] {
  const resources: GcpDemoResourceRecord[] = [];

  for (const template of templates) {
    const resourceLocation = template.location ?? location;

    for (let index = 1; index <= template.count; index += 1) {
      resources.push({
        name: `${template.prefix}${index}`,
        type: template.type,
        location: resourceLocation,
        projectId,
      });
    }
  }

  return resources;
}

function buildClaimsIntakeGcpResources(): GcpDemoResourceRecord[] {
  return expandGcpResourceTemplates("claims-intake-demo", "us-central1", [
    { prefix: "claims-run-", type: "run.googleapis.com/Service", count: 3 },
    { prefix: "claims-sql-", type: "sqladmin.googleapis.com/Instance", count: 2 },
    { prefix: "claims-gcs-", type: "storage.googleapis.com/Bucket", count: 3 },
    { prefix: "claims-pubsub-", type: "pubsub.googleapis.com/Topic", count: 2 },
    { prefix: "claims-kms-", type: "cloudkms.googleapis.com/CryptoKey", count: 1 },
    { prefix: "claims-vpc-", type: "compute.googleapis.com/Network", count: 1 },
  ]);
}

function buildMultiRegionSaasGcpResources(): GcpDemoResourceRecord[] {
  const primary = expandGcpResourceTemplates("saas-platform-demo", "us-central1", [
    { prefix: "saas-gke-", type: "container.googleapis.com/Cluster", count: 1 },
    { prefix: "saas-sql-", type: "sqladmin.googleapis.com/Instance", count: 2 },
    { prefix: "saas-redis-", type: "redis.googleapis.com/Instance", count: 1 },
    { prefix: "saas-run-", type: "run.googleapis.com/Service", count: 4 },
  ]);
  const secondary = expandGcpResourceTemplates("saas-platform-demo", "us-west1", [
    { prefix: "saas-dr-gke-", type: "container.googleapis.com/Cluster", count: 1 },
    { prefix: "saas-dr-sql-", type: "sqladmin.googleapis.com/Instance", count: 2 },
    { prefix: "saas-dr-run-", type: "run.googleapis.com/Service", count: 3 },
  ]);

  return [...primary, ...secondary];
}

function buildFinOpsGcpResources(): GcpDemoResourceRecord[] {
  return expandGcpResourceTemplates("finops-snapshot-demo", "us-central1", [
    { prefix: "idle-gce-", type: "compute.googleapis.com/Instance", count: 6 },
    { prefix: "orphan-disk-", type: "compute.googleapis.com/Disk", count: 8 },
    { prefix: "unused-ip-", type: "compute.googleapis.com/Address", count: 5 },
    { prefix: "oversized-sql-", type: "sqladmin.googleapis.com/Instance", count: 3 },
    { prefix: "legacy-run-", type: "run.googleapis.com/Service", count: 4 },
  ]);
}

export const GCP_INVENTORY_DEMO_SCENARIOS: ReadonlyArray<GcpInventoryDemoScenario> = [
  {
    id: "claims-intake-modernization",
    title: "Claims intake modernization",
    subtitle: "Regulated healthcare-style web + data plane with PHI-adjacent controls.",
    systemName: "claims-intake-gcp",
    wizardBrief:
      "Demo GCP inventory package — claims intake modernization (regulated workload). " +
      "Use to preview review output before InfoSec approves the read-only collector script.",
    manifest: {
      schemaVersion: 1,
      scriptVersion: "0.2.0-demo-claims-gcp",
      collectionTimestamp: "2026-06-20T12:00:00.000Z",
      cloudProvider: "Gcp",
      projectId: "claims-intake-demo",
      scope: "project",
      switchesUsed: ["IncludeOrgPolicy"],
    },
    zipFilename: "archlucid-demo-gcp-claims-intake.zip",
    readme:
      "ArchLucid bundled demo — GCP claims intake modernization. Sanitized synthetic inventory; not customer evidence.",
    buildResources: buildClaimsIntakeGcpResources,
  },
  {
    id: "multi-region-saas-platform",
    title: "Multi-region SaaS platform",
    subtitle: "Primary + DR regions with GKE, Cloud SQL, and traffic routing.",
    systemName: "saas-platform-gcp",
    wizardBrief:
      "Demo GCP inventory package — multi-region SaaS platform spanning us-central1 and us-west1. " +
      "Stress-tests architecture structure and resilience findings without running the live collector.",
    manifest: {
      schemaVersion: 1,
      scriptVersion: "0.2.0-demo-saas-gcp",
      collectionTimestamp: "2026-06-20T12:05:00.000Z",
      cloudProvider: "Gcp",
      projectId: "saas-platform-demo",
      scope: "project",
      switchesUsed: ["IncludeOrgPolicy"],
    },
    zipFilename: "archlucid-demo-gcp-multi-region-saas.zip",
    readme:
      "ArchLucid bundled demo — GCP multi-region SaaS platform. Synthetic cross-region inventory for evaluation only.",
    buildResources: buildMultiRegionSaasGcpResources,
  },
  {
    id: "finops-optimization-snapshot",
    title: "FinOps optimization snapshot",
    subtitle: "Idle GCE, orphaned disks, and oversized Cloud SQL for cost findings.",
    systemName: "finops-snapshot-gcp",
    wizardBrief:
      "Demo GCP inventory package — FinOps optimization snapshot with idle and orphaned resources. " +
      "Preview cost-oriented findings before uploading production inventory.",
    manifest: {
      schemaVersion: 1,
      scriptVersion: "0.2.0-demo-finops-gcp",
      collectionTimestamp: "2026-06-20T12:10:00.000Z",
      cloudProvider: "Gcp",
      projectId: "finops-snapshot-demo",
      scope: "project",
      switchesUsed: ["IncludeBillingExport"],
    },
    zipFilename: "archlucid-demo-gcp-finops-snapshot.zip",
    readme:
      "ArchLucid bundled demo — GCP FinOps optimization snapshot. Illustrative waste patterns; not audited spend data.",
    buildResources: buildFinOpsGcpResources,
  },
];

const scenarioById = new Map(GCP_INVENTORY_DEMO_SCENARIOS.map((scenario) => [scenario.id, scenario]));

const zipBytesCache = new Map<GcpInventoryDemoScenarioId, Uint8Array>();

export function isGcpInventoryDemoScenarioId(value: string | null | undefined): value is GcpInventoryDemoScenarioId {
  if (value === null || value === undefined) {
    return false;
  }

  return scenarioById.has(value as GcpInventoryDemoScenarioId);
}

export function resolveGcpInventoryDemoScenarioId(
  raw: string | null | undefined,
): GcpInventoryDemoScenarioId {
  if (isGcpInventoryDemoScenarioId(raw?.trim())) {
    return raw.trim() as GcpInventoryDemoScenarioId;
  }

  return DEFAULT_GCP_INVENTORY_DEMO_SCENARIO_ID;
}

export function getGcpInventoryDemoScenario(
  scenarioId: GcpInventoryDemoScenarioId = DEFAULT_GCP_INVENTORY_DEMO_SCENARIO_ID,
): GcpInventoryDemoScenario {
  const scenario = scenarioById.get(scenarioId);

  if (scenario === undefined) {
    throw new Error(`Unknown GCP inventory demo scenario: ${scenarioId}`);
  }

  return scenario;
}

export function buildWizardPrefillFromGcpInventoryDemoScenario(
  scenario: GcpInventoryDemoScenario,
): Partial<Pick<WizardFormValues, "description" | "systemName">> {
  return {
    description: scenario.wizardBrief,
    systemName: scenario.systemName,
  };
}

export function getGcpInventoryDemoZipBytes(
  scenarioId: GcpInventoryDemoScenarioId = DEFAULT_GCP_INVENTORY_DEMO_SCENARIO_ID,
): Uint8Array {
  const cached = zipBytesCache.get(scenarioId);

  if (cached !== undefined) {
    return cached;
  }

  const scenario = getGcpInventoryDemoScenario(scenarioId);
  const bytes = zipSync({
    "manifest.json": strToU8(JSON.stringify(scenario.manifest)),
    "resources.json": strToU8(JSON.stringify({ items: scenario.buildResources() })),
    "README.txt": strToU8(scenario.readme),
  });

  zipBytesCache.set(scenarioId, bytes);

  return bytes;
}

export function createGcpInventoryDemoZipFile(
  scenarioId: GcpInventoryDemoScenarioId = DEFAULT_GCP_INVENTORY_DEMO_SCENARIO_ID,
): File {
  const scenario = getGcpInventoryDemoScenario(scenarioId);
  const bytes = getGcpInventoryDemoZipBytes(scenarioId);

  return new File([Uint8Array.from(bytes)], scenario.zipFilename, {
    type: "application/zip",
  });
}
