/**
 * TB-2271 — Approval lineage ≠ Approval queue vocabulary rail.
 *
 * Why two governance surfaces exist:
 * - Approval lineage (`/governance/approval-requests/[id]/lineage`) is the
 *   *linkage view* for one approval request — review, findings, and signed
 *   review record version context.
 * - Approval queue (`/governance/approval-queue`) is the *decision workflow*
 *   hub to submit, approve, or reject governance approvals.
 *
 * They stay separate because inspecting one request’s lineage is not the same
 * task as working the approval queue. Distinct from findings triage and audit.
 */

import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { governanceApprovalRequestParentHref } from "@/lib/governance/governance-lineage-presentation";
import type { PairwiseVocabularyRailModel } from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type ApprovalLineageQueueSurfaceId = "approval-lineage" | "approval-queue";

export type ApprovalLineageQueueLink = {
  readonly id: ApprovalLineageQueueSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ApprovalLineageQueueVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly lineageLink: ApprovalLineageQueueLink;
  readonly queueLink: ApprovalLineageQueueLink;
};

export const APPROVAL_LINEAGE_QUEUE_HEADING =
  "Approval lineage and Approval queue serve different purposes" as const;

export const APPROVAL_LINEAGE_QUEUE_WHY_TWO =
  "Approval lineage shows what review, findings, and finalized review record version one approval request is tied to. The approval queue is where you submit, approve, or reject requests. Lineage is not the queue." as const;

export const APPROVAL_LINEAGE_QUEUE_COMPACT_LINE =
  "Lineage links one approval request; the queue is the decision workflow — open the other when you need both." as const;

/** Approval lineage is per-request; href uses the queue requests section as the stable peer home. */
export const APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK: ApprovalLineageQueueLink = {
  id: "approval-lineage",
  label: "Approval lineage",
  href: governanceApprovalRequestParentHref(""),
  whenToUse: "Inspect linkage for one approval request to review, findings, and finalized review record.",
};

export const APPROVAL_LINEAGE_QUEUE_QUEUE_LINK: ApprovalLineageQueueLink = {
  id: "approval-queue",
  label: "Approval queue",
  href: GOVERNANCE_APPROVAL_QUEUE_PATH,
  whenToUse: "Submit, approve, or reject resolve outcomes requests.",
};

/** Pairwise model for Approval lineage ↔ Approval queue (fixed governance routes). */
export function buildApprovalLineageQueuePairwiseRail(): PairwiseVocabularyRailModel<ApprovalLineageQueueSurfaceId> {
  return {
    heading: APPROVAL_LINEAGE_QUEUE_HEADING,
    whyTwo: APPROVAL_LINEAGE_QUEUE_WHY_TWO,
    compactLine: APPROVAL_LINEAGE_QUEUE_COMPACT_LINE,
    currentLink: APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK,
    peerLink: APPROVAL_LINEAGE_QUEUE_QUEUE_LINK,
  };
}

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildApprovalLineageQueueVocabulary(): ApprovalLineageQueueVocabularyModel {
  const rail = buildApprovalLineageQueuePairwiseRail();

  return {
    heading: rail.heading,
    whyTwo: rail.whyTwo,
    compactLine: rail.compactLine,
    lineageLink: rail.currentLink,
    queueLink: rail.peerLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveApprovalLineageQueuePeerLink(
  currentSurfaceId: ApprovalLineageQueueSurfaceId,
): ApprovalLineageQueueLink {
  if (currentSurfaceId === "approval-lineage") {
    return APPROVAL_LINEAGE_QUEUE_QUEUE_LINK;
  }

  return APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK;
}
