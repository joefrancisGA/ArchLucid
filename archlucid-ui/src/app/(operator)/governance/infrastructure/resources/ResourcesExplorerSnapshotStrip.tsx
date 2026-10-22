"use client";

import { CopyIdButton } from "@/components/CopyIdButton";
import { StatusTag } from "@/components/ui/status-tag";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_INVENTORY_AS_OF_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_INVENTORY_LATEST_SNAPSHOT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_INVENTORY_PINNED_SNAPSHOT_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { formatInfraEvidenceSnapshotCapturedLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { formatInstantCompactMilitary } from "@/lib/locale-datetime";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function formatSnapshotShortId(snapshotId: string): string {
  const trimmed = snapshotId.trim();

  if (trimmed.length <= 12) {
    return trimmed;
  }

  return `${trimmed.slice(0, 8)}…`;
}

export type ResourcesExplorerSnapshotStripProps = {
  readonly snapshot: InfraEvidenceSnapshotSummary | null;
  readonly snapshotPinned: boolean;
  readonly newestLastSeenUtc: string;
};

export function ResourcesExplorerSnapshotStrip(props: ResourcesExplorerSnapshotStripProps): React.JSX.Element | null {
  if (props.snapshot == null && props.newestLastSeenUtc.length === 0) {
    return null;
  }

  const snapshotLabel = props.snapshotPinned
    ? GOVERNANCE_INFRASTRUCTURE_RESOURCES_INVENTORY_PINNED_SNAPSHOT_LABEL
    : GOVERNANCE_INFRASTRUCTURE_RESOURCES_INVENTORY_LATEST_SNAPSHOT_LABEL;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="infra-resource-explorer-snapshot-strip"
      aria-label="Inventory snapshot context"
    >
      {props.snapshot != null ? (
        <>
          <StatusTag kind="neutral" label={snapshotLabel} />
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {formatInfraEvidenceSnapshotCapturedLabel(props.snapshot.capturedUtc)}
          </span>
          <span
            className={cn("inline-flex items-center gap-1 font-mono text-xs text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="infra-resource-explorer-snapshot-id"
          >
            {formatSnapshotShortId(props.snapshot.snapshotId)}
            <CopyIdButton value={props.snapshot.snapshotId} aria-label="Copy inventory snapshot id" />
          </span>
        </>
      ) : null}
      {props.newestLastSeenUtc.length > 0 ? (
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-resource-explorer-inventory-as-of">
          {GOVERNANCE_INFRASTRUCTURE_RESOURCES_INVENTORY_AS_OF_LABEL} {formatInstantCompactMilitary(props.newestLastSeenUtc)}
        </span>
      ) : null}
    </div>
  );
}
