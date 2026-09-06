export type CloudResourceExplorerWorkQueue =
  | "all"
  | "open-findings"
  | "open-remediation"
  | "recent-drift";

export type CloudResourceExplorerWorkQueueOption = {
  readonly id: CloudResourceExplorerWorkQueue;
  readonly label: string;
  readonly summary: string;
};

export const CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS: readonly CloudResourceExplorerWorkQueueOption[] = [
  {
    id: "all",
    label: "All resources",
    summary: "Every cloud resource in the current scope.",
  },
  {
    id: "open-findings",
    label: "Open findings",
    summary: "Resources with open operational security findings.",
  },
  {
    id: "open-remediation",
    label: "Open remediation",
    summary: "Resources with remediation instances not yet closed.",
  },
  {
    id: "recent-drift",
    label: "Recent drift",
    summary: "Resources that appear in inventory diff change rows.",
  },
];

export function parseResourceExplorerWorkQueueFromSearch(
  raw: string | null | undefined,
): CloudResourceExplorerWorkQueue {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim() as CloudResourceExplorerWorkQueue;

  if (CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS.some((option) => option.id === trimmed)) {
    return trimmed;
  }

  return "all";
}

export function resourceExplorerWorkQueueApiValue(workQueue: CloudResourceExplorerWorkQueue): string | null {
  if (workQueue === "all") {
    return null;
  }

  return workQueue;
}

export function formatCloudResourceExplorerWorkQueueLabel(
  workQueue: CloudResourceExplorerWorkQueue,
): string | null {
  if (workQueue === "all") {
    return null;
  }

  const option = CLOUD_RESOURCE_EXPLORER_WORK_QUEUE_OPTIONS.find((entry) => entry.id === workQueue);

  return option?.label ?? workQueue;
}

export function resolveResourceHubTabFromExplorerWorkQueue(
  workQueue: CloudResourceExplorerWorkQueue,
): "findings" | "remediation" | "drift" | undefined {
  switch (workQueue) {
    case "open-findings":
      return "findings";
    case "open-remediation":
      return "remediation";
    case "recent-drift":
      return "drift";
    default:
      return undefined;
  }
}

export function formatResourceHubTabViewLabelFromExplorerWorkQueue(
  workQueue: CloudResourceExplorerWorkQueue,
): string | null {
  const tab = resolveResourceHubTabFromExplorerWorkQueue(workQueue);

  if (tab == null) {
    return null;
  }

  switch (tab) {
    case "findings":
      return "View findings in hub";
    case "remediation":
      return "View remediation in hub";
    case "drift":
      return "View drift in hub";
    default:
      return null;
  }
}

export function formatResourceHubTabActionLabelFromExplorerWorkQueue(
  workQueue: CloudResourceExplorerWorkQueue,
): string | null {
  const tab = resolveResourceHubTabFromExplorerWorkQueue(workQueue);

  if (tab == null) {
    return null;
  }

  switch (tab) {
    case "findings":
      return "Findings";
    case "remediation":
      return "Remediation";
    case "drift":
      return "Drift";
    default:
      return null;
  }
}
