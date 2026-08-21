import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
import { isDemoSeededOverviewInjectedRun } from "@/lib/demo-seeded-overview";
import { deriveOperatorHomeWorkspaceMetrics } from "@/lib/operator/operator-home-workspace-metrics";
import type { RunSummary } from "@/types/authority";
import {
  OPERATOR_HOME_ACTIVE_REVIEWS_HEADING,
  OPERATOR_HOME_ACTIVE_REVIEWS_LEAD,
  OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
  formatOperatorHomeContinueArchitectureLead,
  formatOperatorHomeContinueDraftHeading,
  OPERATOR_HOME_INTENT_CHOOSER_HEADING,
  OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
} from "@/lib/buyer/buyer-polish-copy";

export type OperatorHomeLifecyclePath =
  | "explore-completed-review"
  | "create-architecture"
  | "review-architecture";

export type OperatorHomeWorkspacePhase =
  | "eval-empty"
  | "eval-with-drafts"
  | "active-reviews"
  | "operational";

export type OperatorHomeWorkspacePhaseSignals = {
  /** Tenant reviews only — keeps empty-home sample CTAs visible when only demo rows exist (TB-1039). */
  readonly hasWorkspaceReviews: boolean;
  /** Dashboard-equivalent occupancy — includes showcase/demo rows visible in Recent reviews. */
  readonly hasOverviewReviewRows: boolean;
  readonly draftCount: number;
  readonly hasCommittedManifest: boolean;
  readonly openFindingsCount: number;
  readonly governanceWarningsCount: number;
};

/** Aligns fold phase with runs-dashboard effectiveItems (active rows, including showcase samples). */
export function deriveOperatorHomeWorkspacePhaseSignalsFromOverviewRuns(
  items: readonly RunSummary[],
  totalCount?: number,
): Pick<
  OperatorHomeWorkspacePhaseSignals,
  "hasOverviewReviewRows" | "openFindingsCount" | "governanceWarningsCount"
> {
  const activeItems = items.filter((run) => run.isArchived !== true);
  const tenantItems = activeItems.filter((run) => !isDemoSeededOverviewInjectedRun(run));
  const metrics = deriveOperatorHomeWorkspaceMetrics(tenantItems, tenantItems.length);
  const resolvedTotalCount = typeof totalCount === "number" ? totalCount : activeItems.length;

  return {
    hasOverviewReviewRows: Math.max(resolvedTotalCount, activeItems.length) > 0,
    openFindingsCount: metrics.openFindings,
    governanceWarningsCount: metrics.governanceWarnings,
  };
}

export type OperatorHomePhaseHeroCopy = {
  readonly phase: OperatorHomeWorkspacePhase;
  readonly heading: string;
  readonly lead: string;
  readonly requiresAttention: boolean;
};

/** Resolves Overview workspace phase from live occupancy signals (TB-1037 empty-state guard preserved). */
export function resolveOperatorHomeWorkspacePhase(
  signals: OperatorHomeWorkspacePhaseSignals,
): OperatorHomeWorkspacePhase {
  // Tenant reviews only — showcase/demo rows in Recent reviews must not flip hero phase (TB-1039).
  if (signals.hasCommittedManifest && signals.hasWorkspaceReviews) {
    return "operational";
  }

  if (signals.hasWorkspaceReviews) {
    return "active-reviews";
  }

  if (signals.draftCount > 0) {
    return "eval-with-drafts";
  }

  return "eval-empty";
}

export function resolveOperatorHomeRequiresAttention(
  signals: OperatorHomeWorkspacePhaseSignals,
): boolean {
  const openFindingsCount = Number.isFinite(signals.openFindingsCount)
    ? Math.max(0, Math.trunc(signals.openFindingsCount))
    : 0;
  const governanceWarningsCount = Number.isFinite(signals.governanceWarningsCount)
    ? Math.max(0, Math.trunc(signals.governanceWarningsCount))
    : 0;

  return openFindingsCount > 0 || governanceWarningsCount > 0;
}

export function resolveOperatorHomeLifecycleEmphasizedPath(
  phase: OperatorHomeWorkspacePhase,
): OperatorHomeLifecyclePath | null {
  if (phase === "eval-empty") {
    return "explore-completed-review";
  }

  if (phase === "active-reviews") {
    return "review-architecture";
  }

  if (phase === "eval-with-drafts") {
    return "create-architecture";
  }

  return null;
}

export function resolveOperatorHomePhaseHeroCopy(
  phase: OperatorHomeWorkspacePhase,
  signals: OperatorHomeWorkspacePhaseSignals,
  latestDraftDisplayName?: string | null,
): OperatorHomePhaseHeroCopy {
  const requiresAttention = resolveOperatorHomeRequiresAttention(signals);

  if (phase === "eval-with-drafts") {
    return {
      phase,
      heading: formatOperatorHomeContinueDraftHeading(latestDraftDisplayName ?? ""),
      lead: formatOperatorHomeContinueArchitectureLead(signals.draftCount),
      requiresAttention,
    };
  }

  if (phase === "active-reviews") {
    return {
      phase,
      heading: OPERATOR_HOME_ACTIVE_REVIEWS_HEADING,
      lead: OPERATOR_HOME_ACTIVE_REVIEWS_LEAD,
      requiresAttention,
    };
  }

  if (phase === "operational") {
    return {
      phase,
      heading: OPERATOR_HOME_WORKSPACE_OVERVIEW_HEADING,
      lead: OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
      requiresAttention,
    };
  }

  return {
    phase,
    heading: OPERATOR_HOME_INTENT_CHOOSER_HEADING,
    lead: OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
    requiresAttention,
  };
}

export function resolveLatestArchitectureDraftHref(
  entries: readonly ArchitectureDraftRegistryEntry[],
): string | null {
  if (entries.length === 0) {
    return null;
  }

  const architectureId = entries[0]?.architectureId?.trim() ?? "";

  if (architectureId.length === 0) {
    return null;
  }

  return `/architecture/architectures/${encodeURIComponent(architectureId)}`;
}
