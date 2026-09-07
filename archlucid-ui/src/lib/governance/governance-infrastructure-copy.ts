import {
  GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.infrastructureOverview;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PRIMARY_CONTENT_ID =
  "governance-infrastructure-overview-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_SKIP_LINK_LABEL = "Skip to infrastructure workbenches" as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_LEAD =
  "Open Azure inventory evidence workbenches for snapshots, diagrams, resource hubs, grounded Ask, and remediation instances." as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_TITLE = "Start here" as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BODY =
  "Open the resource explorer first when you need a single cloud resource hub, linked audit evidence, or IDs to paste into audit lineage lookup." as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_ACTION = "Open resource explorer" as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_WORKBENCHES_HEADING = "Evidence workbenches" as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BADGE = "Recommended first step" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.infrastructureAsk;

export const GOVERNANCE_INFRASTRUCTURE_ASK_PRIMARY_CONTENT_ID = "infra-ask-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_SKIP_LINK_LABEL = "Skip to Ask prompt" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_PAGE_LEAD =
  "Ask grounded questions about inventory evidence with citation-backed answers and honest insufficient-evidence outcomes." as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_CLAIM_DISCIPLINE =
  "Answers cite structured inventory rows only — not sealed review records or official assurance materials." as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_TITLE = "Open a resource to start" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_BODY =
  "Browse the resource explorer and choose Ask from a resource hub, or paste a scoped link that includes a cloud resource id." as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_UNSCOPED_ACTION = "Browse resource explorer" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_CONTEXT_LABEL = "Grounded to" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_QUESTION_LABEL = "Question" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_SIMULATOR_DISCLOSURE_TITLE = "Simulator mode" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_SIMULATOR_LABEL =
  "Use deterministic simulator (citation-grounded template for demos)" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_TITLE =
  OPERATOR_NAV_LINK_LABELS.infrastructureDiagramReconcile;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PRIMARY_CONTENT_ID =
  "infra-diagram-reconcile-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SKIP_LINK_LABEL =
  "Skip to diagram reconciliation" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_LEAD =
  "Reconcile an ingested architecture diagram against an Azure inventory snapshot and review correspondence rows." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CLAIM_DISCIPLINE =
  "Correspondence rows are deterministic — AI rationale appears only on Possible or Unknown matches and cannot promote insufficient evidence to confirmed." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SCOPE_LABEL = "Scoped to resource" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_LOAD_ERROR_TITLE =
  "Diagram reconciliation unavailable" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RUN_ID_LABEL = "Sealed review record id" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.infrastructureDiagrams;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID = "infra-diagrams-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SKIP_LINK_LABEL = "Skip to diagram viewer" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD =
  "Render inventory diagrams from snapshot evidence with partitioned fallbacks when graphs exceed readability thresholds." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_CLAIM_DISCIPLINE =
  "Diagram renders reflect inventory snapshot evidence — server PNG export applies tenant branding on the container only, never inside graph nodes." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SCOPE_LABEL = "Scoped to resource" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_LOAD_ERROR_TITLE = "Inventory diagrams unavailable" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_LABEL = "Snapshot" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_MODE_LABEL = "Diagram mode" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_LABEL = "Seed cloud resource id" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.infrastructureDrift;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID = "infra-drift-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL = "Skip to drift comparison" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD =
  "Compare inventory snapshots, inspect semantic drift rows, and export advisory Terraform reconstructed from snapshot evidence." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE =
  "Advisory Terraform exports are reconstructed from inventory evidence — not original Terraform and must not be applied without human review." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_SCOPE_LABEL = "Scoped to resource" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_LOAD_ERROR_TITLE = "Drift workbench unavailable" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_LABEL = "Current snapshot" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_LABEL = "Diff vs other snapshot" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.infrastructureRemediation;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PRIMARY_CONTENT_ID = "infra-remediation-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SKIP_LINK_LABEL = "Skip to remediation factory" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_LEAD =
  "Track remediation instances and waves with advisory-only execute honesty — preflight, approve, execute, and verify against inventory snapshots." as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CLAIM_DISCIPLINE =
  "Execute emits advisory guidance only — not original Terraform and must not be applied without human review and approval." as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SCOPE_LABEL = "Scoped to resource" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_FINDING_SCOPE_LABEL = "Linked from finding" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_LOAD_ERROR_TITLE = "Remediation factory unavailable" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_FINDING_ID_LABEL = "Operational finding id" as const;

export const GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SNAPSHOT_LABEL = "Inventory snapshot" as const;

export type InfrastructureWorkbenchRow = {
  readonly href: string;
  readonly label: string;
  readonly summary: string;
  readonly recommendedFirst?: boolean;
};

/** Hub table rows — overview route is not listed here. */
export const INFRASTRUCTURE_WORKBENCH_ROWS: readonly InfrastructureWorkbenchRow[] = [
  {
    href: GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureDrift,
    summary: "Compare inventory snapshots, classify drift, and export advisory Terraform.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureDiagrams,
    summary: "Render large inventory diagrams with partitioned fallbacks and server PNG export.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureDiagramReconcile,
    summary: "Reconcile uploaded diagrams against inventory snapshots with explainable correspondence rows.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureResources,
    summary: "Explore cloud resources and open the evidence hub for a single resource.",
    recommendedFirst: true,
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureAsk,
    summary: "Ask grounded questions about inventory evidence with citation-backed answers.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureRemediation,
    summary: "Track remediation instances and waves with advisory-only execute honesty.",
  },
];
