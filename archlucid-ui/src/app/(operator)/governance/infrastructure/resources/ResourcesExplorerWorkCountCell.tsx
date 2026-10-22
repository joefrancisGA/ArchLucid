import Link from "next/link";

import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_WORK_NONE_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  buildCloudResourceExplorerWorkCountBadges,
  type CloudResourceExplorerWorkCountBadge,
} from "@/lib/infra-evidence/infra-evidence-explorer-work-counts";
import type { CloudResourceSummary } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { buildResourceExplorerWorkCountHref } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { CloudResourceExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const WORK_MARKER_ABBREVIATIONS: Readonly<Record<CloudResourceExplorerWorkCountBadge["kind"], string>> = {
  findings: "F",
  remediation: "R",
  drift: "D",
};

function workMarkerAccessibleLabel(badge: CloudResourceExplorerWorkCountBadge): string {
  return `${badge.label}: ${badge.count}`;
}

export type ResourcesExplorerWorkCountCellProps = {
  readonly row: CloudResourceSummary;
  readonly workQueue: CloudResourceExplorerWorkQueue;
  readonly snapshotId: string;
};

export function ResourcesExplorerWorkCountCell(props: ResourcesExplorerWorkCountCellProps): React.JSX.Element {
  const badges = buildCloudResourceExplorerWorkCountBadges(props.row.workCounts);

  if (badges.length === 0) {
    return (
      <span className="text-sm text-al-text-secondary">{GOVERNANCE_INFRASTRUCTURE_RESOURCES_WORK_NONE_LABEL}</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1" aria-label="Open work counts">
      {badges.map((badge) => (
        <Link
          key={badge.kind}
          className={cn(
            "rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-900 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800",
            OPERATOR_TYPOGRAPHY.micro,
          )}
          title={badge.label}
          aria-label={workMarkerAccessibleLabel(badge)}
          href={buildResourceExplorerWorkCountHref(
            props.row.cloudResourceId,
            badge.kind,
            props.workQueue,
            props.snapshotId,
          )}
          data-testid={`infra-resource-work-count-${props.row.cloudResourceId}-${badge.kind}`}
        >
          <span aria-hidden="true">{WORK_MARKER_ABBREVIATIONS[badge.kind]}:{badge.count}</span>
        </Link>
      ))}
    </div>
  );
}
