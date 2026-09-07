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
