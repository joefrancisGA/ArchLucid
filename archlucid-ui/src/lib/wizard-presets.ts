import type { WizardFormValues } from "@/lib/wizard-schema";

export type WizardPreset = {
  id: string;
  label: string;
  description: string;
  values: Partial<WizardFormValues>;
};

export function formatWizardPresetStringListHonesty(
  values: readonly string[] | null | undefined,
  fieldLabel: string,
): string | null {
  if (values === null || values === undefined) {
    return `${fieldLabel} were not stored on this starter preset.`;
  }

  if (values.length === 0) {
    return `${fieldLabel} were stored as an empty list on this starter preset.`;
  }

  return null;
}

/** Applies preset field overrides on top of base wizard values (validation runs on step advance and submit). */
export function applyWizardPreset(
  base: WizardFormValues,
  partial: Partial<WizardFormValues>,
): WizardFormValues {
  return { ...base, ...partial };
}

export const WIZARD_STARTER_PRESET_FIELD_COPY = "was filled from starter, not typed." as const;

function normalizeWizardStringList(values: readonly string[] | undefined): readonly string[] {
  return (values ?? []).map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

/** True when the live form value still matches the selected quick-start preset field. */
export function resolveWizardPresetLabel(presetId: string | null | undefined): string {
  const normalized = presetId?.trim() ?? "";

  if (normalized.length === 0) {
    return "Starter preset was not stored yet.";
  }

  const preset = wizardPresets.find((entry) => entry.id === normalized);

  return preset?.label ?? "Starter preset label was not stored.";
}

export function wizardFormFieldMatchesPreset(
  presetId: string,
  field: keyof WizardFormValues,
  formValues: WizardFormValues,
): boolean {
  const preset = wizardPresets.find((entry) => entry.id === presetId);

  if (preset === undefined) {
    return false;
  }

  const presetValue = preset.values[field];

  if (presetValue === undefined) {
    return false;
  }

  const current = formValues[field];

  if (typeof presetValue === "string" && typeof current === "string") {
    return presetValue === current;
  }

  if (Array.isArray(presetValue) && Array.isArray(current)) {
    const left = normalizeWizardStringList(presetValue as string[]);
    const right = normalizeWizardStringList(current as string[]);

    return left.length === right.length && left.every((entry, index) => entry === right[index]);
  }

  return false;
}

const WIZARD_RECAP_PRESET_TRACKED_FIELDS = [
  "systemName",
  "environment",
  "cloudProvider",
  "description",
  "constraints",
  "requiredCapabilities",
] as const satisfies readonly (keyof WizardFormValues)[];

/** True when React Hook Form marked a scalar or array field dirty. */
export function isWizardFormFieldDirty(dirty: unknown): boolean {
  if (Array.isArray(dirty)) {
    return dirty.some(Boolean);
  }

  return dirty === true;
}

/** Fields that still match the starter preset and were not dirtied — for recap honesty. */
export function resolveWizardRecapPresetMatchingFields(input: {
  readonly presetId: string | null | undefined;
  readonly formValues: WizardFormValues;
  readonly dirtyFields: {
    readonly [K in keyof WizardFormValues]?: unknown;
  };
}): readonly (keyof WizardFormValues)[] {
  const presetId = input.presetId?.trim() ?? "";

  if (presetId.length === 0) {
    return [];
  }

  return WIZARD_RECAP_PRESET_TRACKED_FIELDS.filter((field) => {
    if (isWizardFormFieldDirty(input.dirtyFields[field])) {
      return false;
    }

    return wizardFormFieldMatchesPreset(presetId, field, input.formValues);
  });
}

export const wizardPresets: WizardPreset[] = [
  {
    id: "greenfield-web-app",
    label: "Greenfield web app",
    description: "Public web workload on Azure with common platform services.",
    values: {
      systemName: "CustomerWebApp",
      // Must match WizardStepIdentity ENVIRONMENT_OPTIONS — step 0 validates environment before Next.
      environment: "production",
      // "APIs" must keep matching ArchitectureDomainAdmissionPattern (`apis?`); `\bapi\b` alone rejects this preset.
      description:
        "Greenfield customer-facing web application with authenticated APIs, need scalable hosting, SOC-friendly defaults, and cost visibility under $2k/month.",
      constraints: ["Prefer cloud-native hosting", "Budget < $2000/month"],
      requiredCapabilities: ["HTTPS ingress", "Managed database", "CI/CD pipeline"],
    },
  },
  {
    id: "modernize-legacy",
    label: "Modernize legacy system",
    description: "Incremental migration with architecture-structure guidance and optional prior review baseline.",
    values: {
      systemName: "LegacyModernization",
      environment: "production",
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
      environment: "production",
      description:
        "Event-driven architecture integrating multiple bounded contexts via a message bus, idempotent consumers, dead-letter handling, observability for end-to-end traces, and clear ownership of schemas.",
      constraints: ["Cloud-native messaging acceptable", "At-least-once delivery acceptable with idempotent handlers"],
      requiredCapabilities: ["Service Bus or Event Hubs (or equivalent)", "Schema registry or versioned contracts", "Distributed tracing"],
      topologyHints: ["Prefer outbox or transactional inbox for consistency", "Define poison-message and DLQ runbooks"],
    },
  },
  {
    id: "data-lake-analytics",
    label: "Data lake & analytics",
    description: "Ingestion, storage tiers, and curated layers for batch and near-real-time analytics.",
    values: {
      systemName: "AnalyticsDataLake",
      environment: "production",
      description:
        "Enterprise analytics platform landing raw and curated datasets in object storage, orchestrated pipelines, Spark or SQL pools for transformation, and controlled access for BI tools with row-level security expectations.",
      constraints: ["Data residency and encryption at rest", "PII classification and retention policies"],
      requiredCapabilities: ["Object storage lakehouse", "Metadata catalog", "Lineage from ingestion to consumption"],
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
