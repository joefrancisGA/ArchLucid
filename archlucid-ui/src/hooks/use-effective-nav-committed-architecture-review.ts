"use client";

import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/**
 * Single source of the commit-state input to the pre-commit navigation gate
 * (`filterNavLinksByCommittedArchitectureReviewGate`).
 *
 * Two inputs decide it. The tenant's real commit state comes from `CurrentPrincipal`. The
 * buyer-polished shell then satisfies the gate on its own: it is a curated walkthrough that must
 * present the whole destination catalog even though its tenant has never committed a review.
 *
 * Every surface that answers "which destinations exist?" — sidebar, mobile drawer, command palette,
 * and href reachability checks — must read this hook. When they computed the value independently they
 * disagreed: the sidebar passed a hard-coded `true` (so the gate never applied), while the palette
 * passed the raw principal flag (so the gate applied even in the buyer-polished shell), and the same
 * route was simultaneously listed in one surface and hidden in the other.
 */
export function useEffectiveNavCommittedArchitectureReview(): boolean {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();

  return hasCommittedArchitectureReview || isBuyerPolishedOperatorShellEnv();
}
