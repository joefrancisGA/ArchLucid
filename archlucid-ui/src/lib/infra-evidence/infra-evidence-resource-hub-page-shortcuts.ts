import type { PageShortcutEntry } from "@/lib/shortcut-registry";

export const RESOURCE_HUB_PAGE_SHORTCUTS: readonly PageShortcutEntry[] = [
  {
    key: "alt+1",
    label: "Overview tab",
    description: "Switch to the resource hub Overview tab",
  },
  {
    key: "alt+2",
    label: "Drift tab",
    description: "Switch to the resource hub Drift tab",
  },
  {
    key: "alt+3",
    label: "Diagram tab",
    description: "Switch to the resource hub Diagram tab",
  },
  {
    key: "alt+4",
    label: "Terraform tab",
    description: "Switch to the resource hub Terraform tab",
  },
  {
    key: "alt+5",
    label: "Findings tab",
    description: "Switch to the resource hub Findings tab",
  },
  {
    key: "alt+6",
    label: "Remediation tab",
    description: "Switch to the resource hub Remediation tab",
  },
  {
    key: "alt+7",
    label: "Audit lineage tab",
    description: "Switch to the resource hub Audit lineage tab",
  },
  {
    key: "g e",
    label: "Back to explorer",
    description: "Return to the cloud resource explorer (press g then e)",
  },
];
