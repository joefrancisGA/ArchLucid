import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";

const AZURE_CONNECTIONS_PATH = "/integrations/cloud-connections/azure" as const;

export const REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY: EnterpriseCompactEmptyStateProps = {
  title: "No findings to rank yet",
  description:
    "Upload inventory through Extract & upload or connect Azure so operational security findings can be prioritized.",
  actions: [
    { label: "Extract & upload", href: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH, variant: "primary" },
    { label: "Azure connections", href: AZURE_CONNECTIONS_PATH, variant: "outline" },
  ],
  testId: "remediation-factory-priority-queue-empty",
};

export const REMEDIATION_FACTORY_RANKED_PATHS_EMPTY: EnterpriseCompactEmptyStateProps = {
  title: "No ranked paths yet",
  description:
    "Ranked architect paths need inventory snapshots and relationship extraction. Start with Extract & upload or Azure connections.",
  actions: [
    { label: "Extract & upload", href: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH, variant: "primary" },
    { label: "Azure connections", href: AZURE_CONNECTIONS_PATH, variant: "outline" },
  ],
  testId: "remediation-factory-ranked-paths-empty",
};

export const REMEDIATION_FACTORY_INSPECT_PREREQUISITE_EMPTY: EnterpriseCompactEmptyStateProps = {
  title: "Select a ranked row to inspect",
  description:
    "Choose a finding from the priority queue or a path from ranked paths. Inventory must exist before rows appear.",
  testId: "remediation-factory-inspect-prerequisite-empty",
};

export const REMEDIATION_FACTORY_SIMULATOR_PREREQUISITE_EMPTY: EnterpriseCompactEmptyStateProps = {
  title: "Select a finding to explain its score",
  description: "Pick a row in the priority queue, then run the simulator for a deterministic score breakdown.",
  testId: "remediation-factory-simulator-prerequisite-empty",
};
