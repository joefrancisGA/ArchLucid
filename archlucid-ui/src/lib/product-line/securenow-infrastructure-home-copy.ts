import {
  SECURENOW_INFRASTRUCTURE_ASK_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
  SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
  SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
  SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";

import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";

export const SECURENOW_INFRASTRUCTURE_DRIFT_LABEL =
  SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_DRIFT_PATH] ?? "Changes & Drift";

export const SECURENOW_INFRASTRUCTURE_HOME_SECTION_HEADING = "Environment" as const;

export const SECURENOW_INFRASTRUCTURE_HOME_SECTION_LEAD =
  "Explore resources, connections, changes, and evidence-backed answers." as const;

/**
 * SecureNow home — infrastructure evidence workbench destinations.
 * Order matches the Environment navbar, with Terraform mapping last.
 */
export const SECURENOW_INFRASTRUCTURE_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_RESOURCES_PATH],
    summary: "Search collected resources and open the evidence for one resource.",
    recommendedFirst: true,
  },
  {
    href: SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_DIAGRAMS_PATH],
    summary: "See how collected resources connect.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH],
    summary: "Compare an uploaded diagram with what was collected, and see what matches.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_DRIFT_PATH],
    summary: "Compare two collections and see what changed.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_ASK_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_ASK_PATH],
    summary: "Ask a question about this environment. The answer cites collected evidence.",
  },
  {
    href: SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH,
    label: SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_TERRAFORM_PATH],
    summary: "Review suggested Terraform reconstructed from the collection. SecureNow does not apply it.",
  },
];
