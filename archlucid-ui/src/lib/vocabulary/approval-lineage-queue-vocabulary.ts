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

import { APPROVAL_LINEAGE_CANONICAL_PATH_PATTERN } from "@/lib/approval-lineage-evidence-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

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
  "Approval lineage links one approval request to its architecture review, findings, and signed review record version — a governance linkage view. The approval queue is the decision workflow to submit, approve, or reject requests. Lineage is not the queue." as const;

export const APPROVAL_LINEAGE_QUEUE_COMPACT_LINE =
  "Lineage links one approval request; the queue is the decision workflow — open the other when you need both." as const;

export const APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK: ApprovalLineageQueueLink = {
  id: "approval-lineage",
  label: "Approval lineage",
  href: APPROVAL_LINEAGE_CANONICAL_PATH_PATTERN,
  whenToUse: "Inspect linkage for one approval request to review, findings, and signed review record.",
};

export const APPROVAL_LINEAGE_QUEUE_QUEUE_LINK: ApprovalLineageQueueLink = {
  id: "approval-queue",
  label: "Approval queue",
  href: GOVERNANCE_APPROVAL_QUEUE_PATH,
  whenToUse: "Submit, approve, or reject governance approval requests.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildApprovalLineageQueueVocabulary(): ApprovalLineageQueueVocabularyModel {
  return {
    heading: APPROVAL_LINEAGE_QUEUE_HEADING,
    whyTwo: APPROVAL_LINEAGE_QUEUE_WHY_TWO,
    compactLine: APPROVAL_LINEAGE_QUEUE_COMPACT_LINE,
    lineageLink: APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK,
    queueLink: APPROVAL_LINEAGE_QUEUE_QUEUE_LINK,
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
