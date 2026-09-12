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
  "Open Azure inventory evidence workbenches for snapshots, diagrams, diagram reconciliation, resource hubs, grounded Ask, and remediation instances." as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_HUB_INTRO_WORKBENCHES =
  "Azure inventory evidence workbenches for snapshots, diagrams, diagram reconciliation, resource hubs, grounded Ask, and remediation instances." as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_HUB_INTRO_DESTINATIONS =
  "All six destinations are available from this hub." as const;

export const GOVERNANCE_INFRASTRUCTURE_OVERVIEW_HUB_INTRO =
  `${GOVERNANCE_INFRASTRUCTURE_OVERVIEW_HUB_INTRO_WORKBENCHES} ${GOVERNANCE_INFRASTRUCTURE_OVERVIEW_HUB_INTRO_DESTINATIONS}` as const;

export const SECURENOW_HOME_GROUPED_SECTIONS_INTRO =
  `${GOVERNANCE_INFRASTRUCTURE_OVERVIEW_HUB_INTRO_DESTINATIONS} Security, compliance, and infrastructure destinations are grouped below.` as const;

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

export const GOVERNANCE_INFRASTRUCTURE_ASK_SIMULATOR_STATUS_LABEL = "Simulated" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_CANNED_PROMPTS_LABEL = "Canned prompts" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_SHORTCUT_LABEL = "Ctrl+Enter" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_READINESS_EMPTY =
  "Enter a question before asking." as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_READINESS_BUSY = "Waiting for the current answer…" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_BLOCKED_LABEL = "Ask blocked" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_SUBMIT_FAILED_LABEL = "Ask failed" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_SCOPE_BACK_LINKS_LABEL = "Related workbenches" as const;

export const GOVERNANCE_INFRASTRUCTURE_ASK_TRANSCRIPT_INDEX_LABEL = "Ask transcript" as const;

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

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_LOAD_MODEL_ERROR_TITLE =
  "Could not load diagram model" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_REVIEW_ID_REQUIRED_ERROR =
  "Review id required — Enter a sealed review record id before ingesting a diagram." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_DIAGRAM_SOURCE_REQUIRED_ERROR =
  "Diagram source required — Paste Mermaid diagram text before ingesting." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_INGEST_ERROR_TITLE =
  "Diagram ingest failed" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RUN_SNAPSHOT_REQUIRED_ERROR =
  "Run and snapshot required — Select a sealed run and inventory snapshot before reconciling." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RECONCILE_ERROR_TITLE =
  "Reconciliation failed" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_FINDING_ERROR_TITLE =
  "Could not create operational finding" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_COPY_ERROR_TITLE =
  "Copy failed" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RUN_ID_LABEL = "Sealed review record id" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.infrastructureDiagrams;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID = "infra-diagrams-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SKIP_LINK_LABEL = "Skip to diagram viewer" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD =
  "Render inventory diagrams from snapshot evidence. Full subscription shows every resource when readable, or one node per resource group when the leaf graph exceeds readability thresholds. Pick a Resource Group to see resources inside a group." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SCOPE_LABEL = "Scoped to resource" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_LOAD_ERROR_TITLE = "Inventory diagrams unavailable" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_ERROR_TITLE =
  "Could not download diagram PNG" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_ERROR_RECOVERY = {
  whatFailed:
    "Server-side PNG rendering is unavailable in this environment and the browser could not safely rasterize the diagram.",
  whatIsIntact: "The in-browser diagram and Mermaid export remain available.",
  nextStep:
    "Use Export Mermaid (.mmd), screenshot the diagram viewport, or ask your operator to enable Mermaid CLI on the API host.",
} as const;

/** Shown after a successful browser PNG fallback when the API host lacks mmdc. */
export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_BROWSER_FALLBACK_NOTE =
  "Downloaded a browser-rendered PNG because server-side rasterization is unavailable in this environment. Branded server PNG requires Mermaid CLI on the API host." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_LABEL = "Snapshot" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_MODE_LABEL = "Diagram mode" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_LABEL = "Starting Resource" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_PASTE_LABEL = "Resource Id" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_HELPER =
  "Pick a Nodes row, or paste a cloud resource id or ARM id." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_NODES_SEED_HINT =
  "To diagram one resource and its neighbors, choose Focus neighborhood on that row." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_REQUIRED_TITLE =
  "Pick a starting resource before rendering" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_REQUIRED_BODY =
  "Dependency neighborhood starts from one inventory resource. Choose Focus neighborhood on a Nodes row (for example a virtual network). You can also paste a cloud resource id or ARM id, then choose Focus neighborhood." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_PROMPT_TITLE =
  "Choose a starting resource" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_PROMPT_BODY =
  "Open Executive, Network, Identity, or Data, then choose Focus neighborhood on a Nodes row. The diagram shows that resource plus its neighbors." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_FOCUS_ACTION =
  "Focus neighborhood" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_DIALOG_DISMISS =
  "Got it" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_EMPTY_TITLE =
  "Starting resource did not match this snapshot" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_EMPTY_BODY =
  "No neighborhood was found for that starting resource. Choose Focus neighborhood on a Nodes row, or paste the cloud resource id or ARM id for a resource in this snapshot." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_RENDER_FAILED_BODY =
  "Diagram rendering failed for the selected starting resource. Pick a different Nodes row and try again." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_TITLE =
  "No diagram nodes for this mode" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_BODY =
  "This snapshot has no topology nodes for the selected diagram mode. Try Executive, Full subscription, or Pick a Resource Group, or open the resource explorer." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_TITLE = "Resource groups" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_BODY =
  "Choose a resource group to render its inventory diagram." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_PROMPT_TITLE =
  "Pick a resource group" as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_PROMPT_BODY =
  "This list shows resource groups in the selected snapshot. Select a card to render that group." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_MAP_CAPTION =
  "This diagram shows one node per resource group, not every Azure resource. Pick a Resource Group to see resources inside a group." as const;

export const GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PARTITIONED_BODY =
  "This snapshot is too large for a single diagram in the selected mode. Pick a focused view — Executive is the default — or choose Pick a Resource Group." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.infrastructureDrift;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID = "infra-drift-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL = "Skip to drift comparison" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD =
  "Compare inventory snapshots, inspect semantic drift rows, and export advisory Terraform reconstructed from snapshot evidence." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE =
  "Advisory Terraform exports are reconstructed from inventory evidence — not original Terraform and must not be applied without human review." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_SCOPE_LABEL = "Scoped to resource" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_LOAD_ERROR_TITLE = "Drift workbench unavailable" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_ERROR_TITLE =
  "Could not download Terraform advisory export" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_LABEL = "Current snapshot" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_LABEL = "Diff vs other snapshot" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_TITLE = "No inventory snapshots yet" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_BODY =
  "Connect a read-only cloud account and wait for the first inventory capture before comparing drift." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_ACTION = "Open cloud connections" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_DIFFS_TITLE = "No diffs for this snapshot" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_DIFFS_BODY =
  "Drift diffs appear after a second snapshot is captured for the same subscription." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_TITLE = "No drift rows in this diff" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_BODY =
  "Select a snapshot and diff to view property-level changes." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_SCOPED_BODY =
  "No drift rows match the scoped cloud resource for this diff." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_SCOPE_FRESHNESS_LABEL = "Evidence scope" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_FILTER_LABEL = "Resource contains" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RISK_FILTER_LABEL = "Risk" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_CHANGE_TYPE_FILTER_LABEL = "Change type" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_COLUMN_LABEL = "Resource" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_GROUP_COLUMN_LABEL = "Resource group" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_TYPE_COLUMN_LABEL = "Resource type" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_SOURCE_SNAPSHOT_LABEL = "Source snapshot" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_RECEIPT_TITLE = "Advisory export completed" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_DISABLED_NO_SNAPSHOT =
  "Select a snapshot before exporting advisory Terraform." as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_ID_LABEL = "Change id" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_ID_LABEL = "Snapshot id" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_ID_LABEL = "Diff id" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_IDENTIFIERS_TITLE = "Snapshot identifiers" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_IDENTIFIERS_SUMMARY = "Copy snapshot and diff ids" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_IDENTIFIERS_TITLE = "Technical identifiers" as const;

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_LAYER_GUIDANCE_SUMMARY = "How drift compare works" as const;

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

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.infrastructureResources;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_PRIMARY_CONTENT_ID = "infra-resource-explorer-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_SKIP_LINK_LABEL = "Skip to resource list" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_LEAD =
  "Browse cloud resources, apply work-queue filters, and open evidence hubs for drift, findings, remediation, and Ask." as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_CLAIM_DISCIPLINE =
  "The resource list reflects inventory capture scope — snapshot context on links preserves hub scope but does not filter the explorer list." as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_LOAD_ERROR_TITLE = "Resource explorer unavailable" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_NAME_PREFIX_LABEL = "Name prefix" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_TYPE_LABEL = "Resource type" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_RESOURCE_GROUP_LABEL = "Resource group" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_SNAPSHOT_CONTEXT_LABEL = "Snapshot context (links only)" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_SNAPSHOT_CONTEXT_HELPER =
  "Preserves snapshot scope on hub and workbench links. The resource list is not filtered by snapshot." as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCES_REDIRECT_LABEL = "Opening resource evidence hub…" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_TITLE = "Resource evidence hub" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PRIMARY_CONTENT_ID = "infra-resource-hub-primary-content" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SKIP_LINK_LABEL = "Skip to resource evidence hub" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_LEAD =
  "Review drift, findings, remediation, diagram correspondence, Terraform mapping, and audit lineage for one cloud resource." as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CLAIM_DISCIPLINE =
  "Hub tabs surface inventory evidence scoped to this resource — not sealed review records or official assurance materials." as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_LOAD_ERROR_TITLE = "Resource evidence hub unavailable" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CLOUD_RESOURCE_ID_LABEL = "Cloud resource id" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_ARM_RESOURCE_PATH_LABEL = "ARM resource path" as const;

export const GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_TERRAFORM_ADDRESS_LABEL = "Terraform address" as const;

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
    summary: "Render inventory diagrams, a resource group map for large subscriptions, and server PNG export.",
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

export function formatGovernanceInfrastructureInlineActionError(title: string, detail?: string | null): string {
  const trimmed = detail?.trim() ?? "";

  if (trimmed.length > 0) {
    return `${title} — ${trimmed}`;
  }

  return title;
}
