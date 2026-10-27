import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";
import type { RunSummary } from "@/types/authority";

export function isRunNeedingAttention(run: RunSummary): boolean {
  return run.hasFindingsSnapshot === true && run.hasGoldenManifest !== true;
}

export function isRunApprovedPackage(run: RunSummary): boolean {
  return run.hasGoldenManifest === true && run.hasGovernanceWarnings !== true;
}

export function isRunApprovedWithMonitoringPackage(run: RunSummary): boolean {
  return run.hasGoldenManifest === true && run.hasGovernanceWarnings === true;
}

export type RunHomeStatusTag = {
  readonly kind: EnterpriseStatusKind;
  readonly label?: string;
};

export function resolveRunHomeStatusTag(run: RunSummary): RunHomeStatusTag {
  if (isRunNeedingAttention(run)) {
    return { kind: "needs-attention" };
  }

  if (isRunApprovedWithMonitoringPackage(run)) {
    return { kind: "approved-with-monitoring" };
  }

  if (isRunApprovedPackage(run)) {
    return { kind: "approved" };
  }

  if (run.hasFindingsSnapshot === true) {
    return { kind: "in-progress" };
  }

  return { kind: "draft", label: "Draft" };
}

export type RunsDashboardTabCounts = Readonly<Record<RunsDashboardTabId, number>>;

export function normalizeOperatorHomeNonNegativeCount(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.trunc(value));
}

/** Matches dedicated governance count queries: absent or non-finite becomes null. */
export function normalizeOperatorShellNullableCount(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.trunc(value));
}

export function deriveRunsDashboardTabCounts(
  items: readonly RunSummary[],
  awaitingApprovalCount = 0,
): RunsDashboardTabCounts {
  return {
    all: items.length,
    approved: items.filter(isRunApprovedPackage).length,
    "awaiting-approval": normalizeOperatorHomeNonNegativeCount(awaitingApprovalCount),
    attention: items.filter(isRunNeedingAttention).length,
    outcomes: items.filter(isRunApprovedWithMonitoringPackage).length,
  };
}
