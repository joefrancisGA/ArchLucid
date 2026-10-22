import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  shouldSeedStaticDemoGovernanceRecordsForRun,
  tryStaticDemoGovernanceApprovalRequests,
  tryStaticDemoGovernancePromotions,
} from "@/lib/operator/operator-static-demo";
import type {
  GovernanceApprovalRequest,
  GovernanceEnvironmentActivation,
  GovernancePromotionRecord,
} from "@/types/governance-workflow";

import {
  sortGovernanceActivations,
  sortGovernancePromotions,
} from "@/app/(operator)/governance/_sections/governance-workflow-helpers";

export type GovernanceWorkflowRunListsResolved = {
  readonly approvals: GovernanceApprovalRequest[];
  readonly promotions: GovernancePromotionRecord[];
  readonly activations: GovernanceEnvironmentActivation[];
  readonly showingStaticDemoGovernanceRecords: boolean;
  readonly listFailure: ApiLoadFailureState | null;
};

function seedApprovalsIfEmpty(
  runId: string,
  governanceSeedAllowed: boolean,
  approvals: GovernanceApprovalRequest[],
): GovernanceApprovalRequest[] {
  if (approvals.length > 0 || !governanceSeedAllowed) {
    return approvals;
  }

  const seeded = tryStaticDemoGovernanceApprovalRequests(runId);

  return seeded ?? approvals;
}

function seedPromotionsIfEmpty(
  runId: string,
  governanceSeedAllowed: boolean,
  promotions: GovernancePromotionRecord[],
): GovernancePromotionRecord[] {
  if (promotions.length > 0 || !governanceSeedAllowed) {
    return promotions;
  }

  const seeded = tryStaticDemoGovernancePromotions(runId);

  return seeded ?? promotions;
}

/**
 * Merges run-scoped governance list API payloads with static-demo seeding — same rules as the
 * legacy imperative `loadLists` path on the approval-queue page.
 */
export function resolveGovernanceWorkflowRunLists(
  runId: string,
  apiApprovals: GovernanceApprovalRequest[] | undefined,
  apiPromotions: GovernancePromotionRecord[] | undefined,
  apiActivations: GovernanceEnvironmentActivation[] | undefined,
  approvalsError: unknown | null,
  promotionsError: unknown | null,
  activationsError: unknown | null,
): GovernanceWorkflowRunListsResolved {
  const trimmed = runId.trim();
  const governanceSeedAllowed = shouldSeedStaticDemoGovernanceRecordsForRun(trimmed);
  const queryError = approvalsError ?? promotionsError ?? activationsError;

  if (trimmed.length === 0) {
    return {
      approvals: [],
      promotions: [],
      activations: [],
      showingStaticDemoGovernanceRecords: false,
      listFailure: null,
    };
  }

  if (queryError !== null) {
    const seededApprovals = governanceSeedAllowed ? tryStaticDemoGovernanceApprovalRequests(trimmed) : null;
    const seededPromotions = governanceSeedAllowed ? tryStaticDemoGovernancePromotions(trimmed) : null;

    if (seededApprovals !== null || seededPromotions !== null) {
      return {
        approvals: seededApprovals ?? [],
        promotions: sortGovernancePromotions(seededPromotions ?? []),
        activations: [],
        showingStaticDemoGovernanceRecords: seededApprovals !== null,
        listFailure: null,
      };
    }

    return {
      approvals: [],
      promotions: [],
      activations: [],
      showingStaticDemoGovernanceRecords: false,
      listFailure: toApiLoadFailure(queryError),
    };
  }

  const rawApprovals = apiApprovals ?? [];
  const rawPromotions = apiPromotions ?? [];
  const rawActivations = apiActivations ?? [];

  const nextApprovals = seedApprovalsIfEmpty(trimmed, governanceSeedAllowed, rawApprovals);
  const nextPromotions = seedPromotionsIfEmpty(trimmed, governanceSeedAllowed, rawPromotions);

  return {
    approvals: nextApprovals,
    promotions: sortGovernancePromotions(nextPromotions),
    activations: sortGovernanceActivations(rawActivations),
    showingStaticDemoGovernanceRecords:
      governanceSeedAllowed && rawApprovals.length === 0 && nextApprovals.length > 0,
    listFailure: null,
  };
}
