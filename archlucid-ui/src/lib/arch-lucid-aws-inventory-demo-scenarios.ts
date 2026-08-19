import { strToU8, zipSync } from "fflate";

import type { ArchLucidAwsInventoryPackageManifest } from "@/lib/arch-lucid-cloud-inventory-package-manifest";
import type { WizardFormValues } from "@/lib/wizard-schema";

export const AWS_INVENTORY_DEMO_SCENARIO_IDS = [
  "claims-intake-modernization",
  "multi-region-saas-platform",
  "finops-optimization-snapshot",
] as const;

export type AwsInventoryDemoScenarioId = (typeof AWS_INVENTORY_DEMO_SCENARIO_IDS)[number];

export const DEFAULT_AWS_INVENTORY_DEMO_SCENARIO_ID: AwsInventoryDemoScenarioId =
  "claims-intake-modernization";

type AwsDemoResourceRecord = {
  arn: string;
  type: string;
  region: string;
  name: string;
};

type AwsDemoResourceTemplate = {
  prefix: string;
  type: string;
  count: number;
  region?: string;
};

export type AwsInventoryDemoScenario = {
  id: AwsInventoryDemoScenarioId;
  title: string;
  subtitle: string;
  systemName: string;
  wizardBrief: string;
  manifest: ArchLucidAwsInventoryPackageManifest;
  zipFilename: string;
  readme: string;
  buildResources: () => AwsDemoResourceRecord[];
};

function expandAwsResourceTemplates(
  accountId: string,
  region: string,
  templates: ReadonlyArray<AwsDemoResourceTemplate>,
): AwsDemoResourceRecord[] {
  const resources: AwsDemoResourceRecord[] = [];

  for (const template of templates) {
    const resourceRegion = template.region ?? region;

    for (let index = 1; index <= template.count; index += 1) {
      const name = `${template.prefix}${index}`;

      resources.push({
        name,
        type: template.type,
        region: resourceRegion,
        arn: `arn:aws:${template.type.split("::")[1] ?? "ec2"}:${resourceRegion}:${accountId}:${name}`,
      });
    }
  }

  return resources;
}

function buildClaimsIntakeAwsResources(): AwsDemoResourceRecord[] {
  return expandAwsResourceTemplates("222222222222", "us-east-1", [
    { prefix: "claims-api-", type: "AWS::ElasticLoadBalancingV2::LoadBalancer", count: 2 },
    { prefix: "claims-lambda-", type: "AWS::Lambda::Function", count: 3 },
    { prefix: "claims-rds-", type: "AWS::RDS::DBInstance", count: 2 },
    { prefix: "claims-s3-", type: "AWS::S3::Bucket", count: 3 },
    { prefix: "claims-sqs-", type: "AWS::SQS::Queue", count: 2 },
    { prefix: "claims-kms-", type: "AWS::KMS::Key", count: 1 },
    { prefix: "claims-vpc-", type: "AWS::EC2::VPC", count: 1 },
  ]);
}

function buildMultiRegionSaasAwsResources(): AwsDemoResourceRecord[] {
  const primary = expandAwsResourceTemplates("333333333333", "us-east-1", [
    { prefix: "saas-alb-", type: "AWS::ElasticLoadBalancingV2::LoadBalancer", count: 1 },
    { prefix: "saas-eks-", type: "AWS::EKS::Cluster", count: 1 },
    { prefix: "saas-rds-", type: "AWS::RDS::DBInstance", count: 2 },
    { prefix: "saas-elasticache-", type: "AWS::ElastiCache::CacheCluster", count: 1 },
    { prefix: "saas-s3-", type: "AWS::S3::Bucket", count: 2 },
  ]);
  const secondary = expandAwsResourceTemplates("333333333333", "us-west-2", [
    { prefix: "saas-dr-eks-", type: "AWS::EKS::Cluster", count: 1 },
    { prefix: "saas-dr-rds-", type: "AWS::RDS::DBInstance", count: 2 },
    { prefix: "saas-dr-s3-", type: "AWS::S3::Bucket", count: 2 },
  ]);

  return [...primary, ...secondary];
}

function buildFinOpsAwsResources(): AwsDemoResourceRecord[] {
  return expandAwsResourceTemplates("444444444444", "us-east-1", [
    { prefix: "idle-ec2-", type: "AWS::EC2::Instance", count: 6 },
    { prefix: "orphan-ebs-", type: "AWS::EC2::Volume", count: 8 },
    { prefix: "unused-eip-", type: "AWS::EC2::EIP", count: 5 },
    { prefix: "oversized-rds-", type: "AWS::RDS::DBInstance", count: 3 },
    { prefix: "legacy-lambda-", type: "AWS::Lambda::Function", count: 4 },
  ]);
}

export const AWS_INVENTORY_DEMO_SCENARIOS: ReadonlyArray<AwsInventoryDemoScenario> = [
  {
    id: "claims-intake-modernization",
    title: "Claims intake modernization",
    subtitle: "Regulated healthcare-style web + data plane with PHI-adjacent controls.",
    systemName: "claims-intake-aws",
    wizardBrief:
      "Demo AWS inventory package — claims intake modernization (regulated workload). " +
      "Use to preview review output before InfoSec approves the read-only collector script.",
    manifest: {
      schemaVersion: 1,
      scriptVersion: "0.2.0-demo-claims-aws",
      collectionTimestamp: "2026-06-20T12:00:00.000Z",
      cloudProvider: "Aws",
      accountId: "222222222222",
      scope: "account",
      switchesUsed: ["IncludeConfigRules"],
    },
    zipFilename: "archlucid-demo-aws-claims-intake.zip",
    readme:
      "ArchLucid bundled demo — AWS claims intake modernization. Sanitized synthetic inventory; not customer evidence.",
    buildResources: buildClaimsIntakeAwsResources,
  },
  {
    id: "multi-region-saas-platform",
    title: "Multi-region SaaS platform",
    subtitle: "Primary + DR regions with EKS, RDS, and cross-region routing.",
    systemName: "saas-platform-aws",
    wizardBrief:
      "Demo AWS inventory package — multi-region SaaS platform spanning us-east-1 and us-west-2. " +
      "Stress-tests architecture structure and resilience findings without running the live collector.",
    manifest: {
      schemaVersion: 1,
      scriptVersion: "0.2.0-demo-saas-aws",
      collectionTimestamp: "2026-06-20T12:05:00.000Z",
      cloudProvider: "Aws",
      accountId: "333333333333",
      scope: "account",
      switchesUsed: ["IncludeConfigRules"],
    },
    zipFilename: "archlucid-demo-aws-multi-region-saas.zip",
    readme:
      "ArchLucid bundled demo — AWS multi-region SaaS platform. Synthetic cross-region inventory for evaluation only.",
    buildResources: buildMultiRegionSaasAwsResources,
  },
  {
    id: "finops-optimization-snapshot",
    title: "FinOps optimization snapshot",
    subtitle: "Idle EC2, orphaned EBS volumes, and oversized RDS for cost findings.",
    systemName: "finops-snapshot-aws",
    wizardBrief:
      "Demo AWS inventory package — FinOps optimization snapshot with idle and orphaned resources. " +
      "Preview cost-oriented findings before uploading production inventory.",
    manifest: {
      schemaVersion: 1,
      scriptVersion: "0.2.0-demo-finops-aws",
      collectionTimestamp: "2026-06-20T12:10:00.000Z",
      cloudProvider: "Aws",
      accountId: "444444444444",
      scope: "account",
      switchesUsed: ["IncludeCostExplorer"],
    },
    zipFilename: "archlucid-demo-aws-finops-snapshot.zip",
    readme:
      "ArchLucid bundled demo — AWS FinOps optimization snapshot. Illustrative waste patterns; not audited spend data.",
    buildResources: buildFinOpsAwsResources,
  },
];

const scenarioById = new Map(AWS_INVENTORY_DEMO_SCENARIOS.map((scenario) => [scenario.id, scenario]));

const zipBytesCache = new Map<AwsInventoryDemoScenarioId, Uint8Array>();

export function isAwsInventoryDemoScenarioId(value: string | null | undefined): value is AwsInventoryDemoScenarioId {
  if (value === null || value === undefined) {
    return false;
  }

  return scenarioById.has(value as AwsInventoryDemoScenarioId);
}

export function resolveAwsInventoryDemoScenarioId(
  raw: string | null | undefined,
): AwsInventoryDemoScenarioId {
  if (isAwsInventoryDemoScenarioId(raw?.trim())) {
    return raw.trim() as AwsInventoryDemoScenarioId;
  }

  return DEFAULT_AWS_INVENTORY_DEMO_SCENARIO_ID;
}

export function getAwsInventoryDemoScenario(
  scenarioId: AwsInventoryDemoScenarioId = DEFAULT_AWS_INVENTORY_DEMO_SCENARIO_ID,
): AwsInventoryDemoScenario {
  const scenario = scenarioById.get(scenarioId);

  if (scenario === undefined) {
    throw new Error(`Unknown AWS inventory demo scenario: ${scenarioId}`);
  }

  return scenario;
}

export function buildWizardPrefillFromAwsInventoryDemoScenario(
  scenario: AwsInventoryDemoScenario,
): Partial<Pick<WizardFormValues, "description" | "systemName">> {
  return {
    description: scenario.wizardBrief,
    systemName: scenario.systemName,
  };
}

export function getAwsInventoryDemoZipBytes(
  scenarioId: AwsInventoryDemoScenarioId = DEFAULT_AWS_INVENTORY_DEMO_SCENARIO_ID,
): Uint8Array {
  const cached = zipBytesCache.get(scenarioId);

  if (cached !== undefined) {
    return cached;
  }

  const scenario = getAwsInventoryDemoScenario(scenarioId);
  const bytes = zipSync({
    "manifest.json": strToU8(JSON.stringify(scenario.manifest)),
    "resources.json": strToU8(JSON.stringify(scenario.buildResources())),
    "README.txt": strToU8(scenario.readme),
  });

  zipBytesCache.set(scenarioId, bytes);

  return bytes;
}

export function createAwsInventoryDemoZipFile(
  scenarioId: AwsInventoryDemoScenarioId = DEFAULT_AWS_INVENTORY_DEMO_SCENARIO_ID,
): File {
  const scenario = getAwsInventoryDemoScenario(scenarioId);
  const bytes = getAwsInventoryDemoZipBytes(scenarioId);

  return new File([Uint8Array.from(bytes)], scenario.zipFilename, {
    type: "application/zip",
  });
}
