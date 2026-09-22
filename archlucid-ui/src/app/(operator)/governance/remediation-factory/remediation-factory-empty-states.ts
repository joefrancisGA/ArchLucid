import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import {
  SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT,
  SECURENOW_PATH_RANKED_PATHS_EMPTY,
} from "@/lib/product-line/securenow-path-inspect-copy";
import { SECURENOW_ARCHITECT_METRICS_SNAPSHOTS_EMPTY } from "@/lib/product-line/securenow-architect-metrics-copy";

export const REMEDIATION_FACTORY_EXECUTIVE_METRICS_LOADING =
  "Loading executive remediation metrics for the current workspace scope…" as const;

export const REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY: EnterpriseCompactEmptyStateProps = {
  title: "Priority queue empty",
  description:
    "No open operational security findings to rank in the current workspace scope. Refresh after new findings arrive or widen scope via inventory snapshots.",
  testId: "remediation-factory-priority-queue-empty",
};

export const REMEDIATION_FACTORY_RANKED_PATHS_EMPTY: EnterpriseCompactEmptyStateProps = {
  title: "No ranked architect paths",
  description: SECURENOW_PATH_RANKED_PATHS_EMPTY,
  testId: "remediation-factory-ranked-paths-empty",
};

export const REMEDIATION_FACTORY_PATH_INSPECT_SELECT_PROMPT: EnterpriseCompactEmptyStateProps = {
  title: "Select a queue row",
  description: SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT,
  testId: "remediation-factory-path-inspect-select-prompt",
};

export const REMEDIATION_FACTORY_SIMULATOR_SELECT_PROMPT: EnterpriseCompactEmptyStateProps = {
  title: "Select a priority finding",
  description: "Choose a priority queue row, then run the simulator to view the deterministic score breakdown.",
  testId: "remediation-factory-simulator-select-prompt",
};

export const REMEDIATION_FACTORY_ARCHITECT_SNAPSHOTS_EMPTY: EnterpriseCompactEmptyStateProps = {
  title: "Snapshot comparison unavailable",
  description: SECURENOW_ARCHITECT_METRICS_SNAPSHOTS_EMPTY,
  testId: "remediation-factory-architect-snapshots-empty",
};
