/** Infrastructure evidence workbench routes under `/governance/infrastructure/*` (SH-11–SH-17). */

import type { PageContextualHelpRow } from "@/lib/contextual-help/types";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH } from "@/lib/audit-evidence-lineage-route";
import {
  GOVERNANCE_POLICY_PACKS_PATH,
} from "@/lib/governance/governance-route-paths";

const GOVERNANCE_REMEDIATION_FACTORY_PATH = "/governance/remediation-factory" as const;

const GOVERNANCE_REMEDIATION_PATTERNS_PATH = "/governance/remediation-patterns" as const;

const GOVERNANCE_INFRASTRUCTURE_RESOURCES_CONTEXTUAL_HELP = {
  whatIsThisPage: `Resource explorer — ${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD}`,
  whatToDoNext:
    "Filter by name prefix, resource type, or resource group, then open a resource hub or copy IDs for audit lineage lookup.",
  whyEmpty: "Resources appear after Azure inventory capture from a connection or extract and upload.",
  whereToConfigurePrerequisite:
    "Connect Azure or upload inventory with extract and upload before the explorer lists resources.",
  whatToDoNextAction: {
    label: "Open audit evidence lineage",
    href: AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
  },
  whereToConfigureAction: {
    label: "Open Azure connections",
    href: `${CLOUD_CONNECTIONS_PATH}/azure`,
  },
  taskSteps: [
    "Apply work-queue filters — snapshot context on links preserves hub scope but does not filter the list.",
    "Open a resource evidence hub for drift, findings, remediation, diagram correspondence, Terraform, and audit lineage.",
    "Copy assessment, snapshot, and control IDs when audit lineage lookup needs inventory-linked evidence.",
  ],
} as const;

const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage: `Resource evidence hub — ${GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_LEAD}`,
  whatToDoNext:
    "Review hub tabs for drift, findings, remediation, diagram correspondence, Terraform mapping, and audit lineage for this resource.",
  whyEmpty: "Hub evidence appears after Azure inventory capture exists for this cloud resource.",
  whereToConfigurePrerequisite:
    "Connect Azure or upload inventory with extract and upload before hub tabs show snapshot-backed evidence.",
  whatToDoNextAction: {
    label: "Open audit evidence lineage",
    href: AUDIT_EVIDENCE_LINEAGE_LOOKUP_PATH,
  },
  whereToConfigureAction: {
    label: "Browse resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  taskSteps: [
    "Confirm snapshot context on scoped links before opening drift, diagrams, or remediation workbenches.",
    "Copy assessment, snapshot, and control IDs from audit lineage tabs when export bundles need them.",
    "Return to the resource explorer when scope needs narrowing or a different resource.",
  ],
} as const;

const GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Advisory Terraform workbench — review advisory Terraform mapping reconstructed from inventory evidence. This is not original Terraform and must not be applied without human review.",
  whatToDoNext:
    "Pick a snapshot and resource scope, inspect the advisory mapping, then export only after human review.",
  whyEmpty: "Advisory Terraform mapping appears after inventory snapshots exist for your scope.",
  whereToConfigurePrerequisite:
    "Connect Azure or upload inventory with extract and upload before snapshot-backed mapping is available.",
  whatToDoNextAction: {
    label: "Open drift workbench",
    href: GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  },
  whereToConfigureAction: {
    label: "Open resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  taskSteps: [
    "Open this workbench from a scoped resource hub or explorer row when mapping is resource-specific.",
    "Inspect advisory addresses reconstructed from inventory — not original Terraform or a cloud apply.",
    "Export only after human review; use drift compare when property-level changes need context.",
  ],
} as const;

const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_CONTEXTUAL_HELP = {
  whatIsThisPage: `Inventory diagrams — ${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD}`,
  whatToDoNext:
    "Select a snapshot, render the inventory diagram, then export server PNG when procurement needs a shareable image.",
  whyEmpty: "Diagram renders appear after inventory snapshots exist for your scope.",
  whereToConfigurePrerequisite:
    "Connect Azure or upload inventory with extract and upload before diagram renders are available.",
  whatToDoNextAction: {
    label: "Open resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  whereToConfigureAction: {
    label: "Open diagram reconciliation",
    href: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  },
  taskSteps: [
    "Wait for or select an inventory snapshot before rendering.",
    "Use partitioned fallbacks when graphs exceed readability thresholds.",
    "Export server PNG only after confirming the snapshot scope matches buyer questions.",
  ],
} as const;

const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CONTEXTUAL_HELP = {
  whatIsThisPage: `Diagram reconciliation — ${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_LEAD}`,
  whatToDoNext:
    "Select an ingested diagram and inventory snapshot, then inspect explainable correspondence rows.",
  whyEmpty: "Correspondence rows appear after both an inventory snapshot and an ingested diagram exist.",
  whereToConfigurePrerequisite:
    "Connect Azure or upload inventory, and ingest a diagram with authority, before reconciliation runs.",
  whatToDoNextAction: {
    label: "Open inventory diagrams",
    href: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  },
  whereToConfigureAction: {
    label: "Open resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  taskSteps: [
    "Pick a snapshot and ingested diagram — correspondence is deterministic, not a sealed review record.",
    "Review explainable rows; AI rationale appears only on Possible or Unknown matches.",
    "Return to inventory diagrams or a resource hub when scope needs narrowing.",
  ],
} as const;

const GOVERNANCE_INFRASTRUCTURE_ASK_CONTEXTUAL_HELP = {
  whatIsThisPage: `Infrastructure Ask — ${GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD}`,
  whatToDoNext:
    "Open Ask from a resource hub or scoped link, ask a grounded question, then follow citation links in the answer.",
  whyEmpty: GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_BODY,
  whereToConfigurePrerequisite:
    "Inventory snapshots from Azure connections or extract and upload must exist before citations can ground answers.",
  whatToDoNextAction: {
    label: "Browse resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  whereToConfigureAction: {
    label: "Open resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  taskSteps: [
    "Scope Ask to a resource hub — unscoped Ask stays empty until a cloud resource id is present.",
    "Ask grounded questions and follow citations; insufficient-evidence outcomes are honest.",
    "Use simulator mode only as a deterministic demo template — not a live model guarantee.",
  ],
} as const;

const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CONTEXTUAL_HELP = {
  whatIsThisPage: `Infrastructure remediation — ${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_LEAD}`,
  whatToDoNext:
    "Filter remediation instances and waves, run preflight, then follow verify against inventory snapshots after execute.",
  whyEmpty: "Remediation instances appear after operational findings and approved patterns exist for your scope.",
  whereToConfigurePrerequisite:
    "Open remediation factory for ranked findings and remediation patterns for governed pattern versions.",
  whatToDoNextAction: {
    label: "Open remediation factory",
    href: GOVERNANCE_REMEDIATION_FACTORY_PATH,
  },
  whereToConfigureAction: {
    label: "Open remediation patterns",
    href: GOVERNANCE_REMEDIATION_PATTERNS_PATH,
  },
  taskSteps: [
    "Track instance and wave status — execute emits advisory guidance only, not a cloud apply.",
    "Run preflight and approve before execute, then verify against inventory snapshots.",
    "Open remediation factory when executive metrics or priority ranking needs attention.",
  ],
} as const;

const GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Extract and upload — run the read-only Azure extractor locally, validate the ZIP, then upload inventory for SecureNow inventory workbenches and ARC-AMPE scans.",
  whatToDoNext:
    "Copy the quick-start extractor command, upload a validated inventory ZIP, then open the resource explorer or drift workbench.",
  whyEmpty:
    "Upload controls are ready when you have Admin or Execute authority; progress rows appear after a package is selected.",
  whereToConfigurePrerequisite:
    "Uploading packages needs workspace Admin or Execute authority; Azure connectors are optional for ZIP-only intake.",
  whatToDoNextAction: {
    label: "Open resource explorer",
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
  },
  whereToConfigureAction: {
    label: "Open policy packs",
    href: GOVERNANCE_POLICY_PACKS_PATH,
  },
  taskSteps: [
    "Copy the quick-start extractor command and run it locally — read-only, no vendor credentials in your subscription.",
    "Upload a validated securenow-azure-package.zip inventory ZIP.",
    "Open resource explorer or drift when the upload completes.",
  ],
} as const;

const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PREFIX = `${GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH}/` as const;

export const GOVERNANCE_INFRASTRUCTURE_WORKBENCH_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
    entry: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_CONTEXTUAL_HELP,
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
    entry: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CONTEXTUAL_HELP,
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PREFIX,
    entry: GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    exactPathOnly: true,
    entry: GOVERNANCE_INFRASTRUCTURE_RESOURCES_CONTEXTUAL_HELP,
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_PATH,
    entry: GOVERNANCE_INFRASTRUCTURE_TERRAFORM_CONTEXTUAL_HELP,
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
    entry: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_CONTEXTUAL_HELP,
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
    entry: GOVERNANCE_INFRASTRUCTURE_ASK_CONTEXTUAL_HELP,
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
    entry: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CONTEXTUAL_HELP,
  },
];
