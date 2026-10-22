import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
export const GOVERNANCE_ASSIGNED_TO_ME_PATH_INSPECT_SELECT_PROMPT: EnterpriseCompactEmptyStateProps = {
  title: "Select an assigned finding",
  description:
    "Select one assigned row to load path inspect. Hop evidence, weakest-hop band limits, and rank prose stay advisory — not live Azure changes.",
  testId: "governance-assigned-to-me-path-inspect-select-prompt",
};

export const GOVERNANCE_FINDINGS_QUEUE_PATH_INSPECT_SELECT_PROMPT: EnterpriseCompactEmptyStateProps = {
  title: "Select a finding",
  description:
    "Select one findings queue row to load path inspect. Hop evidence, weakest-hop band limits, and rank prose stay advisory — not live Azure changes.",
  testId: "governance-findings-queue-path-inspect-select-prompt",
};
