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
    id: "blank-advanced",
    label: "Blank (advanced)",
    description: "Minimal defaults only — fill every field manually.",
    values: {},
  },
];
