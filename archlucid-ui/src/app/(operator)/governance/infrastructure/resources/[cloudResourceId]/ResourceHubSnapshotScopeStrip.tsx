"use client";

import { CopyIdButton } from "@/components/CopyIdButton";
import { StatusTag } from "@/components/ui/status-tag";
import {
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_INVENTORY_LATEST_SNAPSHOT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCES_INVENTORY_PINNED_SNAPSHOT_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function formatSnapshotShortId(snapshotId: string): string {
  const trimmed = snapshotId.trim();

  if (trimmed.length <= 12) {
    return trimmed;
  }

  return `${trimmed.slice(0, 8)}…`;
}

export type ResourceHubSnapshotScopeStripProps = {
  readonly snapshotId: string;
  readonly snapshotPinned: boolean;
  readonly runId: string;
};

export function ResourceHubSnapshotScopeStrip(props: ResourceHubSnapshotScopeStripProps): React.JSX.Element | null {
  const { snapshotId, snapshotPinned, runId } = props;

  if (snapshotId.length === 0 && runId.length === 0) {
    return null;
  }

  const snapshotLabel = snapshotPinned
    ? GOVERNANCE_INFRASTRUCTURE_RESOURCES_INVENTORY_PINNED_SNAPSHOT_LABEL
    : GOVERNANCE_INFRASTRUCTURE_RESOURCES_INVENTORY_LATEST_SNAPSHOT_LABEL;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="infra-resource-hub-snapshot-scope-strip"
      aria-label="Resource hub evidence scope"
    >
      {snapshotId.length > 0 ? (
        <>
          <StatusTag kind="neutral" label={snapshotLabel} />
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Snapshot</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 font-mono text-xs text-al-text-secondary",
              OPERATOR_TYPOGRAPHY.helper,
            )}
            data-testid="infra-resource-hub-snapshot-id"
          >
            {formatSnapshotShortId(snapshotId)}
            <CopyIdButton value={snapshotId} aria-label="Copy inventory snapshot id" />
          </span>
        </>
      ) : null}
      {runId.length > 0 ? (
        <>
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Run</span>
          <span
            className={cn(
              "inline-flex items-center gap-1 font-mono text-xs text-al-text-secondary",
              OPERATOR_TYPOGRAPHY.helper,
            )}
            data-testid="infra-resource-hub-run-id"
          >
            {formatSnapshotShortId(runId)}
            <CopyIdButton value={runId} aria-label="Copy architecture review run id" />
          </span>
        </>
      ) : null}
    </div>
  );
}
