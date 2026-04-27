import { wizardFormSchema, type WizardFormValues } from "@/lib/wizard-schema";

export type WizardPreset = {
  id: string;
  label: string;
  description: string;
  values: Partial<WizardFormValues>;
};

/**
 * Applies preset field overrides on top of base wizard values and re-parses (defaults + validation).
 */
export function applyWizardPreset(
  base: WizardFormValues,
  partial: Partial<WizardFormValues>,
): WizardFormValues {
  return wizardFormSchema.parse({ ...base, ...partial });
}

export const wizardPresets: WizardPreset[] = [
  {
    id: "greenfield-web-app",
    label: "Greenfield web app",
    description: "Public web workload on Azure with common platform services.",
    values: {
      systemName: "CustomerWebApp",
      description:
        "Greenfield customer-facing web application with authenticated APIs, need scalable hosting on Azure, SOC-friendly defaults, and cost visibility under $2k/month.",
      constraints: ["Must run on Azure", "Budget < $2000/month"],
      requiredCapabilities: ["HTTPS ingress", "Managed database", "CI/CD pipeline"],
    },
  },
  {
    id: "modernize-legacy",
    label: "Modernize legacy system",
    description: "Incremental migration with topology guidance and optional prior manifest baseline.",
    values: {
      systemName: "LegacyModernization",
      description:
        "Strangler-style migration from on-prem monolith to cloud-native services; preserve data contracts during transition and minimize downtime for batch interfaces.",
      priorManifestVersion: "",
      topologyHints: [
        "Prefer strangler fig pattern for user-facing flows",
        "Isolate integration adapters behind a stable API façade",
      ],
    },
  },
  {
    id: "event-driven-integration",
    label: "Event-driven integration",
    description: "Queues, topics, and async boundaries between services on Azure.",
    values: {
      systemName: "EventDrivenPlatform",
      description:
        "Event-driven architecture integrating multiple bounded contexts via a message bus (Azure Service Bus or Event Hubs), idempotent consumers, dead-letter handling, observability for end-to-end traces, and clear ownership of schemas.",
      constraints: ["Azure-native messaging", "At-least-once delivery acceptable with idempotent handlers"],
      requiredCapabilities: ["Service Bus or Event Hubs", "Schema registry or versioned contracts", "Distributed tracing"],
      topologyHints: ["Prefer outbox or transactional inbox for consistency", "Define poison-message and DLQ runbooks"],
    },
  },
  {
    id: "data-lake-analytics",
    label: "Data lake & analytics",
    description: "Ingestion, storage tiers, and curated layers for batch and near-real-time analytics.",
    values: {
      systemName: "AnalyticsDataLake",
      description:
        "Enterprise analytics platform landing raw and curated datasets in Azure Data Lake Storage, orchestrated pipelines (ADF or Synapse), Spark or SQL pools for transformation, and governed access for BI tools with row-level security expectations.",
      constraints: ["Data residency and encryption at rest", "PII classification and retention policies"],
      requiredCapabilities: ["ADLS Gen2", "Metadata catalog", "Lineage from ingestion to consumption"],
      securityBaselineHints: ["Private endpoints for storage and SQL", "Managed identities for pipeline principals"],
    },
  },
  {
    id: "blank-advanced",
    label: "Blank (advanced)",
    description: "Minimal defaults only — fill every field manually.",
    values: {},
  },
];
