/**
 * TB-2304 — Package Governance ≠ Approval queue vocabulary rail.
 *
 * Why two surfaces exist:
 * - Package Governance (`?archTab=governance` / review Policies tab) is
 *   pre-finalize readiness on one architecture package — policy alignment and
 *   approval checks before commit.
 * - Approval queue (`/governance/approval-queue`) is the live approve / reject
 *   workflow across pending resolve outcome requests.
 *
 * They stay separate because package readiness is not the live approval
 * workflow. Distinct from Approval lineage ≠ Approval queue (TB-2260 family).
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  governanceApprovalQueueHref,
} from "@/lib/governance/governance-route-paths";
import { createExternalPeerPairwiseVocabularyRail } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type PackageGovernanceApprovalQueueSurfaceId =
  | "package-governance"
  | "approval-queue";

export type PackageGovernanceApprovalQueueLink = {
  readonly id: PackageGovernanceApprovalQueueSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type PackageGovernanceApprovalQueueVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly packageGovernanceLink: PackageGovernanceApprovalQueueLink;
  readonly approvalQueueLink: PackageGovernanceApprovalQueueLink;
};

export const PACKAGE_GOVERNANCE_APPROVAL_QUEUE_HEADING =
  "Finalize readiness and Approval queue serve different purposes" as const;

export const PACKAGE_GOVERNANCE_APPROVAL_QUEUE_WHY_TWO =
  "Finalize readiness checks this review before you finalize — policy alignment and approval checks. The approval queue is where you approve or reject pending requests. Checking readiness is not the same as approving a request." as const;

export const PACKAGE_GOVERNANCE_APPROVAL_QUEUE_COMPACT_LINE =
  "Finalize readiness checks policy alignment before finalize; Approval queue handles live approvals." as const;

/**
 * Peer from Approval queue without a run: Reviews hub, because Governance is
 * package-scoped (open Governance / Policies on a package from the list).
 */
export const PACKAGE_GOVERNANCE_APPROVAL_QUEUE_REVIEWS_PEER_LINK: PackageGovernanceApprovalQueueLink =
  {
    id: "package-governance",
    label: "Reviews (open Policies)",
    href: REVIEWS_LIST_PATH,
    whenToUse: "Open an architecture package, then check policy alignment before you finalize.",
  };

export const PACKAGE_GOVERNANCE_APPROVAL_QUEUE_QUEUE_LINK: PackageGovernanceApprovalQueueLink =
  {
    id: "approval-queue",
    label: "Approval queue",
    href: GOVERNANCE_APPROVAL_QUEUE_PATH,
    whenToUse: "Approve or reject pending resolve outcome requests.",
  };

/** Build vocabulary; pass runId when mounting on a package Governance / Policies tab. */
export function buildPackageGovernanceApprovalQueuePairwiseRail(runId?: string | null) {
  return createExternalPeerPairwiseVocabularyRail({
    runId,
    reviewSurfaceId: "package-governance",
    externalSurfaceId: "approval-queue",
    reviewTabId: "policies",
    copy: {
      heading: PACKAGE_GOVERNANCE_APPROVAL_QUEUE_HEADING,
      whyTwo: PACKAGE_GOVERNANCE_APPROVAL_QUEUE_WHY_TWO,
      compactLine: PACKAGE_GOVERNANCE_APPROVAL_QUEUE_COMPACT_LINE,
      reviewSideLabel: "Policies and standards",
      reviewSideWhenToUse: "Check policy alignment before you finalize this architecture package.",
    },
    reviewsPeerFallbackLink: PACKAGE_GOVERNANCE_APPROVAL_QUEUE_REVIEWS_PEER_LINK,
    externalPeerLinkBase: PACKAGE_GOVERNANCE_APPROVAL_QUEUE_QUEUE_LINK,
    buildExternalPeerHref: governanceApprovalQueueHref,
  });
}

/** Build vocabulary; pass runId when mounting on a package Governance / Policies tab. */
export function buildPackageGovernanceApprovalQueueVocabulary(
  runId?: string | null,
): PackageGovernanceApprovalQueueVocabularyModel {
  const rail = buildPackageGovernanceApprovalQueuePairwiseRail(runId);

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    packageGovernanceLink: rail.reviewSideLink,
    approvalQueueLink: rail.externalPeerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolvePackageGovernanceApprovalQueuePeerLink(
  currentSurfaceId: PackageGovernanceApprovalQueueSurfaceId,
  model: PackageGovernanceApprovalQueueVocabularyModel,
): PackageGovernanceApprovalQueueLink {
  if (currentSurfaceId === "package-governance") {
    return model.approvalQueueLink;
  }

  return model.packageGovernanceLink;
}
