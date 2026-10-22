import type { CloudResourceExplorerWorkCounts } from "@/lib/infra-evidence/infra-evidence-hub-types";

export type CloudResourceExplorerWorkCountKind = "findings" | "remediation" | "drift";

export type CloudResourceExplorerWorkCountBadge = {
  readonly kind: CloudResourceExplorerWorkCountKind;
  readonly label: string;
  readonly count: number;
};

export function buildCloudResourceExplorerWorkCountBadges(
  workCounts: CloudResourceExplorerWorkCounts | null,
): readonly CloudResourceExplorerWorkCountBadge[] {
  if (workCounts == null) {
    return [];
  }

  const badges: CloudResourceExplorerWorkCountBadge[] = [];

  if (workCounts.openOperationalFindingsCount > 0) {
    badges.push({
      kind: "findings",
      label: "Open findings",
      count: workCounts.openOperationalFindingsCount,
    });
  }

  if (workCounts.openRemediationInstancesCount > 0) {
    badges.push({
      kind: "remediation",
      label: "Open remediation",
      count: workCounts.openRemediationInstancesCount,
    });
  }

  if (workCounts.inventoryDriftChangeCount > 0) {
    badges.push({
      kind: "drift",
      label: "Drift changes",
      count: workCounts.inventoryDriftChangeCount,
    });
  }

  return badges;
}
