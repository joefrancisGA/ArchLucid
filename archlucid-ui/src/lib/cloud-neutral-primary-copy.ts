/**
 * Cloud-neutral primary UX copy and generic capability vocabulary (multi-cloud posture).
 * Provider-specific service names belong in provider-scoped pages, selected-cloud flows,
 * or explicit comparison tables — not in default explanatory text before cloud selection.
 */

/** Generic architecture capabilities mapped to provider services (for help/compare surfaces). */
export const CLOUD_CAPABILITY_PROVIDER_MAP = [
  {
    capability: "Managed HTTP API / web tier",
    azure: "App Service",
    aws: "ECS Fargate / Elastic Beanstalk",
    gcp: "Cloud Run / App Engine",
  },
  {
    capability: "Relational transactional datastore",
    azure: "Azure SQL Database",
    aws: "Amazon RDS",
    gcp: "Cloud SQL",
  },
  {
    capability: "Secrets and configuration",
    azure: "Key Vault",
    aws: "Secrets Manager / Parameter Store",
    gcp: "Secret Manager",
  },
  {
    capability: "Identity for workloads",
    azure: "Microsoft Entra workload identity",
    aws: "IAM roles for service accounts",
    gcp: "Workload Identity Federation",
  },
  {
    capability: "Asynchronous messaging",
    azure: "Service Bus",
    aws: "Amazon SQS / SNS",
    gcp: "Pub/Sub",
  },
  {
    capability: "Object / blob storage",
    azure: "Blob Storage",
    aws: "Amazon S3",
    gcp: "Cloud Storage",
  },
  {
    capability: "Private service connectivity",
    azure: "Private Link",
    aws: "VPC endpoints / PrivateLink",
    gcp: "Private Service Connect",
  },
  {
    capability: "Kubernetes platform",
    azure: "AKS",
    aws: "EKS",
    gcp: "GKE",
  },
  {
    capability: "Read-only inventory export",
    azure: "ArchLucid Azure packager ZIP",
    aws: "ArchLucid AWS packager ZIP",
    gcp: "ArchLucid GCP packager ZIP",
  },
] as const;

/** Shared neutral phrasing for surfaces shown before the user selects a cloud target. */
export const CLOUD_NEUTRAL_PRIMARY_COPY = {
  reviewsNewPageLead:
    "Create an architecture review from a diagram, brief, or document. Cloud connection is optional.",
  executiveBaselineBannerBody:
    "Sponsor ROI summaries stay grounded when you upload a cloud inventory ZIP (AWS, Azure, or GCP) for this workspace. Use the baseline upload wizard to parse packager output and start your first review from measured inventory.",
  corePilotInventoryStepDetail:
    "Run the read-only cloud inventory script for your selected provider locally, then upload a ZIP (`manifest.json` + `resources.json`) from Extract & Upload settings or review detail. If you are using brief, document, or diagram evidence only, skip this step — findings will still run and may have lower confidence on cost claims.",
  corePilotFirstSessionInventoryBullet:
    "Upload a cloud inventory ZIP after commit (AWS, Azure, or GCP) so ROI and cost findings cite measured inventory.",
  demoExplainConversionLead:
    "Upload architecture evidence (brief, diagram, document, or optional cloud inventory ZIP) to get a review like this in about 15 minutes.",
  roiStaleInventoryHint:
    "Uploaded cost evidence is stale. Re-run the read-only inventory script for your cloud provider to refresh pricing inputs.",
  roiKpiMissingInventoryHint:
    "Upload a cloud inventory ZIP to ground cost evidence in measured spend.",
  finishSetupInventoryAccelerator:
    "Optional accelerator: upload a cloud inventory ZIP (AWS, Azure, or GCP) for production-faithful subscription inventory.",
  wizardCloudTargetHint:
    "Evidence-only is the default first-pilot path. Cloud inventory ZIPs for AWS, Azure, or GCP accelerate topology and cost findings when your security team approves the read-only extractor.",
  /** Scoped claim — workflow is multi-cloud; deterministic rule depth is not identical. */
  scopedCloudCoverageClaim:
    "Works across clouds; rule coverage by cloud is documented.",
} as const;

/** Cloud target dropdown labels — equal weight; no accelerated/default provider callouts. */
export const WIZARD_CLOUD_PROVIDER_OPTIONS = {
  none: "No cloud / evidence-only",
  aws: "Amazon Web Services",
  gcp: "Google Cloud Platform",
  azure: "Microsoft Azure",
} as const;

/** Shown when optional inventory is expanded before a cloud target is selected on the identity step. */
export const WIZARD_INVENTORY_REQUIRES_CLOUD_TARGET =
  "Select a cloud target in the identity step to see the read-only inventory script for your provider.";

/**
 * Phrases that must not appear in {@link CLOUD_NEUTRAL_PRIMARY_COPY} values
 * (implies Azure is required, default, or uniquely accelerated before selection).
 */
export const CLOUD_NEUTRAL_PRIMARY_BANNED_PHRASES: readonly string[] = [
  "azure connection is optional",
  "azure extractor zip is optional",
  "upload your azure",
  "upload an azure extractor",
  "must connect azure",
  "connect azure before",
  "accelerated v1 path",
  "azure-first",
  "default to azure",
] as const;

export function listCloudNeutralPrimaryCopyViolations(
  surfaces: Readonly<Record<string, string>> = CLOUD_NEUTRAL_PRIMARY_COPY,
): string[] {
  const violations: string[] = [];

  for (const [surfaceId, text] of Object.entries(surfaces)) {
    const normalized = text.toLowerCase();

    for (const phrase of CLOUD_NEUTRAL_PRIMARY_BANNED_PHRASES) {
      if (normalized.includes(phrase)) {
        violations.push(`${surfaceId}: banned phrase "${phrase}"`);
      }
    }
  }

  return violations;
}
