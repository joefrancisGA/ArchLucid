import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";
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
  readonly hasWorkspaceReviews: boolean;
  readonly draftCount: number;
  readonly hasCommittedManifest: boolean;
  readonly openFindingsCount: number;
  readonly governanceWarningsCount: number;
};

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
    return null;
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
