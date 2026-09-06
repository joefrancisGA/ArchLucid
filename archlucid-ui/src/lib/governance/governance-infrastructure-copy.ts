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

export type InfrastructureWorkbenchStatus = "Coming soon" | "Available";

export type InfrastructureWorkbenchRow = {
  readonly href: string;
  readonly label: string;
  readonly shippedInBatch: string;
  readonly status: InfrastructureWorkbenchStatus;
  readonly summary: string;
};

/** Hub table rows — overview route is not listed here. */
export const INFRASTRUCTURE_WORKBENCH_ROWS: readonly InfrastructureWorkbenchRow[] = [
  {
    href: GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureDrift,
    shippedInBatch: "IE-UX-01",
    status: "Available",
    summary: "Compare inventory snapshots, classify drift, and export advisory Terraform.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureDiagrams,
    shippedInBatch: "IE-UX-02",
    status: "Coming soon",
    summary: "Render large inventory diagrams with partitioned fallbacks and server PNG export.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureDiagramReconcile,
    shippedInBatch: "IE-UX-03",
    status: "Coming soon",
    summary: "Reconcile uploaded diagrams against inventory snapshots with explainable match rows.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_RESOURCES_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureResources,
    shippedInBatch: "IE-UX-04",
    status: "Coming soon",
    summary: "Explore cloud resources and open the evidence hub for a single resource.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_ASK_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureAsk,
    shippedInBatch: "IE-UX-04",
    status: "Coming soon",
    summary: "Ask grounded questions about inventory evidence with citation-backed answers.",
  },
  {
    href: GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureRemediation,
    shippedInBatch: "IE-UX-05",
    status: "Coming soon",
    summary: "Track remediation instances and waves with advisory-only execute honesty.",
  },
];
