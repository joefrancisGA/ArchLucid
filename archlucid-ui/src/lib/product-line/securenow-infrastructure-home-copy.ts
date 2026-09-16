import {
  SECURENOW_INFRASTRUCTURE_ASK_PATH,
  SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
  SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
  SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_INFRASTRUCTURE_HOME_SECTION_HEADING = "Infrastructure" as const;

export const SECURENOW_INFRASTRUCTURE_HOME_SECTION_LEAD =
  "Explore Azure inventory snapshots, diagrams, resource evidence hubs, and grounded Ask." as const;

/** SecureNow home — infrastructure evidence workbench destinations. */
export const SECURENOW_INFRASTRUCTURE_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureResources,
    summary: "Explore cloud resources and open the evidence hub for a single resource.",
    recommendedFirst: true,
  },
  {
    href: SECURENOW_INFRASTRUCTURE_DECLARED_CONNECTIONS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureDeclaredConnections,
    summary:
      "Declare ConnectsTo or DependsOn edges between resources when config files or tribal knowledge are not ingested.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureDrift,
    summary: "Compare inventory snapshots, classify drift, and export advisory Terraform.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureTerraform,
    summary: "Review advisory Terraform mapping reconstructed from inventory evidence.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureDiagrams,
    summary: "Render diagrams, a resource group map for large subscriptions, and server PNG export.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureDiagramReconcile,
    summary: "Reconcile uploaded diagrams against inventory snapshots with explainable correspondence rows.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_ASK_PATH,
    label: OPERATOR_NAV_LINK_LABELS.infrastructureAsk,
    summary: "Ask grounded questions about inventory evidence with citation-backed answers.",
  },
];
