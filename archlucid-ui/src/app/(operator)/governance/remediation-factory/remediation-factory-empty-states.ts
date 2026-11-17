import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import {
  SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT,
  SECURENOW_PATH_RANKED_PATHS_EMPTY,
} from "@/lib/product-line/securenow-path-inspect-copy";
import { SECURENOW_ARCHITECT_METRICS_SNAPSHOTS_EMPTY } from "@/lib/product-line/securenow-architect-metrics-copy";
import {
  GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { REVIEWS_NEW_PATH } from "@/lib/architecture/architecture-routes";
import { SECURENOW_INVESTIGATION_EFFORT_PATH } from "@/lib/product-line/securenow-investigation-effort-copy";

export const REMEDIATION_FACTORY_EXECUTIVE_METRICS_LOADING =
  "Loading executive remediation metrics for the current workspace scope…" as const;

export const REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY: EnterpriseCompactEmptyStateProps = {
  title: "Priority queue empty",
  description:
    "No open operational security findings to rank in the current workspace scope. Refresh after new findings arrive or widen scope via inventory snapshots.",
  actions: [{ label: "Start an architecture review", href: REVIEWS_NEW_PATH, variant: "primary" }],
  testId: "remediation-factory-priority-queue-empty",
};

export const REMEDIATION_FACTORY_RANKED_PATHS_EMPTY: EnterpriseCompactEmptyStateProps = {
  title: "No ranked architect paths",
  description: SECURENOW_PATH_RANKED_PATHS_EMPTY,
  actions: [
    { label: "Upload inventory", href: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH, variant: "primary" },
    { label: "Open collection", href: CLOUD_CONNECTIONS_PATH, variant: "outline" },
  ],
  testId: "remediation-factory-ranked-paths-empty",
};

/** When collection is incomplete, cloud setup is the primary recovery path before manual upload. */
export function resolveRemediationFactoryRankedPathsEmptyState(
  collectionSetupComplete: boolean,
): EnterpriseCompactEmptyStateProps {
  if (collectionSetupComplete) {
    return {
      ...REMEDIATION_FACTORY_RANKED_PATHS_EMPTY,
      actions: [
        ...(REMEDIATION_FACTORY_RANKED_PATHS_EMPTY.actions ?? []),
        {
          label: "Synthetic ROI walkthrough",
          href: SECURENOW_INVESTIGATION_EFFORT_PATH,
          variant: "outline",
        },
      ],
    };
  }

  return {
    ...REMEDIATION_FACTORY_RANKED_PATHS_EMPTY,
    actions: [
      { label: "Open collection", href: CLOUD_CONNECTIONS_PATH, variant: "primary" },
      { label: "Upload inventory", href: GOVERNANCE_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH, variant: "outline" },
    ],
  };
}

/** When collection is incomplete, cloud setup is the primary recovery path before starting a review. */
export function resolveRemediationFactoryPriorityQueueEmptyState(
  collectionSetupComplete: boolean,
): EnterpriseCompactEmptyStateProps {
  if (collectionSetupComplete) {
    return {
      ...REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY,
      actions: [
        ...(REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY.actions ?? []),
        {
          label: "Synthetic ROI walkthrough",
          href: SECURENOW_INVESTIGATION_EFFORT_PATH,
          variant: "outline",
        },
      ],
    };
  }

  return {
    ...REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY,
    actions: [
      { label: "Open collection", href: CLOUD_CONNECTIONS_PATH, variant: "primary" },
      { label: "Start an architecture review", href: REVIEWS_NEW_PATH, variant: "outline" },
    ],
  };
}

/** When collection is incomplete, nudge cloud setup before running the priority simulator. */
export function resolveRemediationFactorySimulatorSelectPrompt(
  collectionSetupComplete: boolean,
): EnterpriseCompactEmptyStateProps {
  if (collectionSetupComplete) {
    return {
      ...REMEDIATION_FACTORY_SIMULATOR_SELECT_PROMPT,
      actions: [
        {
          label: "Synthetic ROI walkthrough",
          href: SECURENOW_INVESTIGATION_EFFORT_PATH,
          variant: "outline",
        },
      ],
    };
  }

  return {
    ...REMEDIATION_FACTORY_SIMULATOR_SELECT_PROMPT,
    actions: [
      { label: "Open collection", href: CLOUD_CONNECTIONS_PATH, variant: "primary" },
    ],
  };
}

/** When collection is incomplete, prefer cloud setup before snapshot comparison. */
export function resolveRemediationFactoryArchitectSnapshotsEmptyState(
  collectionSetupComplete: boolean,
): EnterpriseCompactEmptyStateProps {
  if (collectionSetupComplete) {
    return {
      ...REMEDIATION_FACTORY_ARCHITECT_SNAPSHOTS_EMPTY,
      actions: [
        {
          label: "Review changes and drift",
          href: SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
          variant: "primary",
        },
        {
          label: "Synthetic ROI walkthrough",
          href: SECURENOW_INVESTIGATION_EFFORT_PATH,
          variant: "outline",
        },
      ],
    };
  }

  return {
    ...REMEDIATION_FACTORY_ARCHITECT_SNAPSHOTS_EMPTY,
    actions: [
      { label: "Open collection", href: CLOUD_CONNECTIONS_PATH, variant: "primary" },
    ],
  };
}

/** When collection is incomplete, nudge cloud setup before path inspect work. */
export function resolveRemediationFactoryPathInspectSelectPrompt(
  collectionSetupComplete: boolean,
): EnterpriseCompactEmptyStateProps {
  if (collectionSetupComplete) {
    return {
      ...REMEDIATION_FACTORY_PATH_INSPECT_SELECT_PROMPT,
      actions: [
        {
          label: "Synthetic ROI walkthrough",
          href: SECURENOW_INVESTIGATION_EFFORT_PATH,
          variant: "outline",
        },
      ],
    };
  }

  return {
    ...REMEDIATION_FACTORY_PATH_INSPECT_SELECT_PROMPT,
    actions: [
      { label: "Open collection", href: CLOUD_CONNECTIONS_PATH, variant: "primary" },
    ],
  };
}

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
