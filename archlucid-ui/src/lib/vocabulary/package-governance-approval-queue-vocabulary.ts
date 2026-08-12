/**
 * TB-2304 — Package Governance ≠ Approval queue vocabulary rail.
 *
 * Why two surfaces exist:
 * - Package Governance (`?archTab=governance` / review Policies tab) is
 *   pre-finalize readiness on one architecture package — policy alignment and
 *   governance checks before commit.
 * - Approval queue (`/governance/approval-queue`) is the live approve / reject
 *   workflow across pending governance approval requests.
 *
 * They stay separate because package readiness is not the live approval
 * workflow. Distinct from Approval lineage ≠ Approval queue (TB-2260 family).
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture-workspace-tabs";
import {
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  governanceApprovalQueueHref,
} from "@/lib/governance/governance-route-paths";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";

export type PackageGovernanceHrefKind = "archTab" | "reviewTab";

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
  "Package Governance and Approval queue do different jobs" as const;

export const PACKAGE_GOVERNANCE_APPROVAL_QUEUE_WHY_TWO =
  "Package Governance is pre-finalize readiness on one architecture package — policy alignment and governance checks before commit. Approval queue is the live approve and reject workflow for pending governance approval requests. Checking package readiness is not the same as approving a request." as const;

export const PACKAGE_GOVERNANCE_APPROVAL_QUEUE_COMPACT_LINE =
  "Package Governance is pre-finalize readiness; Approval queue is live approve workflow — open the other when you need that job." as const;

/**
 * Peer from Approval queue without a run: Reviews hub, because Governance is
 * package-scoped (open Governance / Policies on a package from the list).
 */
export const PACKAGE_GOVERNANCE_APPROVAL_QUEUE_REVIEWS_PEER_LINK: PackageGovernanceApprovalQueueLink =
  {
    id: "package-governance",
    label: "Reviews (open Governance)",
    href: REVIEWS_LIST_PATH,
    whenToUse: "Open an architecture package, then use Governance for pre-finalize readiness.",
  };

export const PACKAGE_GOVERNANCE_APPROVAL_QUEUE_QUEUE_LINK: PackageGovernanceApprovalQueueLink =
  {
    id: "approval-queue",
    label: "Approval queue",
    href: GOVERNANCE_APPROVAL_QUEUE_PATH,
    whenToUse: "Approve or reject pending governance approval requests.",
  };

/** Build vocabulary; pass runId when mounting on a package Governance / Policies tab. */
export function buildPackageGovernanceApprovalQueueVocabulary(
  runId?: string | null,
  hrefKind: PackageGovernanceHrefKind = "archTab",
): PackageGovernanceApprovalQueueVocabularyModel {
  const trimmed = runId?.trim() ?? "";

  const packageGovernanceHref =
    trimmed.length === 0
      ? null
      : hrefKind === "reviewTab"
        ? buildReviewDetailTabHref(trimmed, "policies")
        : buildArchitectureWorkspaceTabHref(trimmed, "governance");

  const packageGovernanceLink: PackageGovernanceApprovalQueueLink =
    packageGovernanceHref !== null
      ? {
          id: "package-governance",
          label: hrefKind === "reviewTab" ? "Policies and standards" : "Governance",
          href: packageGovernanceHref,
          whenToUse: "Review pre-finalize governance readiness for this architecture package.",
        }
      : PACKAGE_GOVERNANCE_APPROVAL_QUEUE_REVIEWS_PEER_LINK;

  const approvalQueueLink: PackageGovernanceApprovalQueueLink = {
    ...PACKAGE_GOVERNANCE_APPROVAL_QUEUE_QUEUE_LINK,
    href: governanceApprovalQueueHref(trimmed.length > 0 ? trimmed : null),
  };

  return {
    heading: PACKAGE_GOVERNANCE_APPROVAL_QUEUE_HEADING,
    whyTwo: PACKAGE_GOVERNANCE_APPROVAL_QUEUE_WHY_TWO,
    compactLine: PACKAGE_GOVERNANCE_APPROVAL_QUEUE_COMPACT_LINE,
    packageGovernanceLink,
    approvalQueueLink,
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
