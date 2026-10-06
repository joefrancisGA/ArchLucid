import { AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_SHORTCUTS } from "@/lib/audit-evidence-control-lineage-page-shortcuts";
import { DECLARED_CONNECTIONS_PAGE_SHORTCUTS } from "@/lib/governance/declared-connections-page-shortcuts";
import { DIAGRAM_RECONCILE_WORKBENCH_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-page-shortcuts";
import { DIAGRAMS_WORKBENCH_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-diagrams-page-shortcuts";
import { DRIFT_WORKBENCH_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-drift-page-shortcuts";
import { RESOURCE_HUB_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-resource-hub-page-shortcuts";
import { RESOURCES_EXPLORER_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-resources-explorer-page-shortcuts";
import { REMEDIATION_WORKBENCH_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-remediation-page-shortcuts";
import { TERRAFORM_WORKBENCH_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-terraform-page-shortcuts";
import { EVIDENCE_GRAPH_PAGE_SHORTCUTS } from "@/lib/evidence-graph-page-shortcuts";
import { EXTRACT_UPLOAD_PAGE_SHORTCUTS } from "@/lib/shortcut-registry";

export type HelpPageShortcutEntry = {
  readonly key?: string;
  readonly id?: string;
  readonly label: string;
  readonly description: string;
};

export type HelpPageShortcutGroup = {
  readonly label: string;
  readonly entries: readonly HelpPageShortcutEntry[];
};

export const HELP_PAGE_SHORTCUT_GROUPS: readonly HelpPageShortcutGroup[] = [
  { label: "Extract & upload", entries: EXTRACT_UPLOAD_PAGE_SHORTCUTS },
  { label: "Evidence graph", entries: EVIDENCE_GRAPH_PAGE_SHORTCUTS },
  { label: "Infrastructure drift", entries: DRIFT_WORKBENCH_PAGE_SHORTCUTS },
  { label: "Infrastructure diagrams", entries: DIAGRAMS_WORKBENCH_PAGE_SHORTCUTS },
  { label: "Diagram reconciliation", entries: DIAGRAM_RECONCILE_WORKBENCH_PAGE_SHORTCUTS },
  { label: "Resource explorer", entries: RESOURCES_EXPLORER_PAGE_SHORTCUTS },
  { label: "Resource hub", entries: RESOURCE_HUB_PAGE_SHORTCUTS },
  { label: "Declared connections", entries: DECLARED_CONNECTIONS_PAGE_SHORTCUTS },
  { label: "Remediation", entries: REMEDIATION_WORKBENCH_PAGE_SHORTCUTS },
  { label: "Terraform mapping", entries: TERRAFORM_WORKBENCH_PAGE_SHORTCUTS },
  { label: "Audit evidence lineage", entries: AUDIT_EVIDENCE_CONTROL_LINEAGE_PAGE_SHORTCUTS },
];
