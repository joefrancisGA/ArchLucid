/** Drift workbench hub and its help topic. */

import type { PageContextualHelpEntry, PageContextualHelpRow } from "@/lib/contextual-help/types";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CANONICAL_PATH,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TOPIC_LABEL,
} from "@/lib/governance/governance-infrastructure-drift-help-evidence-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  GOVERNANCE_INFRASTRUCTURE_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

const GOVERNANCE_INFRASTRUCTURE_DRIFT_ARCHITECTURE_HUB_CONTEXTUAL_HELP = {
  whatIsThisPage:
    "Compare inventory snapshots, inspect semantic drift rows, and export advisory Terraform reconstructed from snapshot evidence.",
  whatToDoNext:
    "Pick a current snapshot and diff snapshot, then filter drift rows before opening change detail or exporting advisory Terraform.",
  whyEmpty: "Snapshots and drift diffs appear after cloud inventory capture exists for your scope.",
  whereToConfigurePrerequisite:
    "Connect a read-only cloud account and wait for inventory snapshots before comparing drift.",
  whatToDoNextAction: {
    label: "Open cloud connections",
    href: CLOUD_CONNECTIONS_PATH,
  },
  whereToConfigureAction: {
    label: "Open infrastructure overview",
    href: GOVERNANCE_INFRASTRUCTURE_PATH,
  },
  taskSteps: [
    "Connect a read-only cloud account and wait for inventory snapshots.",
    "Pick current and diff snapshots to compare property-level changes.",
    "Filter drift rows and export advisory Terraform only after human review.",
  ],
} as const satisfies PageContextualHelpEntry;

const GOVERNANCE_INFRASTRUCTURE_DRIFT_SECURITY_HUB_CONTEXTUAL_HELP = {
  ...GOVERNANCE_INFRASTRUCTURE_DRIFT_ARCHITECTURE_HUB_CONTEXTUAL_HELP,
  whyEmpty: "Snapshots and drift diffs appear after Azure inventory capture exists for your scope.",
  whereToConfigurePrerequisite:
    "Connect a read-only Azure subscription or upload inventory with extract and upload, then wait for snapshots before comparing drift.",
  whatToDoNextAction: {
    label: "Open Azure connections",
    href: `${CLOUD_CONNECTIONS_PATH}/azure`,
  },
  whereToConfigureAction: {
    label: "Open extract and upload",
    href: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  },
  taskSteps: [
    "Connect a read-only Azure subscription or upload inventory with extract and upload, then wait for snapshots.",
    "Pick current and diff snapshots to compare property-level changes.",
    "Filter drift rows and export advisory Terraform only after human review.",
  ],
} as const satisfies PageContextualHelpEntry;

/** Product-line drift drawer copy — Security is Azure-only (SH-26). */
export function governanceInfrastructureDriftHubContextualHelpEntry(
  productLineId: ProductLineId,
): PageContextualHelpEntry {
  if (productLineId === "security") {
    return GOVERNANCE_INFRASTRUCTURE_DRIFT_SECURITY_HUB_CONTEXTUAL_HELP;
  }

  return GOVERNANCE_INFRASTRUCTURE_DRIFT_ARCHITECTURE_HUB_CONTEXTUAL_HELP;
}

export const GOVERNANCE_INFRASTRUCTURE_DRIFT_CONTEXTUAL_HELP_ROWS: readonly PageContextualHelpRow[] = [
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
    entry: GOVERNANCE_INFRASTRUCTURE_DRIFT_ARCHITECTURE_HUB_CONTEXTUAL_HELP,
  },
  {
    prefix: GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_CANONICAL_PATH,
    entry: {
      whatIsThisPage: `Drift and snapshots — ${GOVERNANCE_INFRASTRUCTURE_DRIFT_HELP_TOPIC_LABEL.toLowerCase()} for inventory evidence workbenches.`,
      whatToDoNext:
        "Open the drift workbench to compare snapshots, then follow resource explorer or inventory diagrams when scope needs narrowing.",
      whyEmpty: "This guide is always available; live snapshots appear after cloud inventory capture exists.",
      whereToConfigurePrerequisite:
        "Confirm cloud connections and snapshot capture before trusting drift rows or advisory exports.",
      whatToDoNextAction: {
        label: "Open drift workbench",
        href: GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH,
      },
      whereToConfigureAction: {
        label: "Open cloud connections",
        href: CLOUD_CONNECTIONS_PATH,
      },
    },
  },
];
