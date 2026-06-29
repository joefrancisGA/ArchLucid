/** Shippable evidence source ids for the full guided wizard evidence step (TB-341). */
export type WizardEvidenceSourceId =
  | "brief"
  | "documents"
  | "diagrams"
  | "iac"
  | "azure-export"
  | "aws-inventory"
  | "gcp-inventory"
  | "demo";

/** V1.1-only sources shown disabled with honest badges — not selectable. */
export type WizardEvidenceSourceDeferredId =
  | "generic-inventory-json"
  | "structurizr-archimate";

export type WizardEvidenceSourceAvailability = "available" | "accelerated" | "v1.1";

export type WizardEvidenceSourceOption = {
  id: WizardEvidenceSourceId | WizardEvidenceSourceDeferredId;
  label: string;
  description: string;
  availability: WizardEvidenceSourceAvailability;
};

export const WIZARD_EVIDENCE_SOURCE_OPTIONS: readonly WizardEvidenceSourceOption[] = [
  {
    id: "brief",
    label: "Brief",
    description: "Describe the architecture in the guided intake.",
    availability: "available",
  },
  {
    id: "documents",
    label: "Documents",
    description: "Attach design docs, ADRs, Markdown, PDFs, or requirements.",
    availability: "available",
  },
  {
    id: "diagrams",
    label: "Diagrams",
    description: "Use architecture diagrams as review evidence.",
    availability: "available",
  },
  {
    id: "iac",
    label: "IaC / Terraform",
    description: "Attach infrastructure declarations for context.",
    availability: "available",
  },
  {
    id: "azure-export",
    label: "Azure inventory ZIP",
    description: "Customer-controlled Azure subscription inventory.",
    availability: "accelerated",
  },
  {
    id: "aws-inventory",
    label: "AWS inventory ZIP",
    description: "Customer-controlled AWS account inventory.",
    availability: "accelerated",
  },
  {
    id: "gcp-inventory",
    label: "GCP inventory ZIP",
    description: "Customer-controlled GCP project inventory.",
    availability: "accelerated",
  },
  {
    id: "demo",
    label: "Demo",
    description: "Use labeled simulator data when your own evidence is not ready.",
    availability: "available",
  },
  {
    id: "generic-inventory-json",
    label: "Generic inventory JSON",
    description: "Non-Azure inventory import for hybrid estates.",
    availability: "v1.1",
  },
  {
    id: "structurizr-archimate",
    label: "Structurizr / ArchiMate import",
    description: "Planned model-import source.",
    availability: "v1.1",
  },
] as const;

export function isSelectableWizardEvidenceSourceId(
  id: WizardEvidenceSourceOption["id"],
): id is WizardEvidenceSourceId {
  return id !== "generic-inventory-json" && id !== "structurizr-archimate";
}

export function wizardEvidenceSourceTestId(id: WizardEvidenceSourceOption["id"]): string {
  return `wizard-evidence-source-${id}`;
}
