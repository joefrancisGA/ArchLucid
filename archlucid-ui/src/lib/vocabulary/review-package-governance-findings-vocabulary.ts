/**
 * TB-2386 — Review-package findings tab ≠ Governance findings queue vocabulary rail.
 *
 * Why two surfaces exist:
 * - Review Findings tab (`/architecture/reviews/{runId}?reviewTab=findings`) scopes to
 *   one architecture review package — triage, export, and cluster disposition within
 *   that review.
 * - Findings queue (`/governance/findings`) is the workspace risk register across
 *   reviews for disposition, ownership, and exception work.
 *
 * They stay separate because triage on one review does not replace cross-review
 * disposition, and workspace register counts may not match this review's tab without
 * explicit scope context.
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  buildGovernanceFindingsQueueHref,
  buildReviewDetailFindingsTabHref,
} from "@/lib/metric-count-presentation";

export type ReviewPackageGovernanceFindingsSurfaceId =
  | "review-package-findings"
  | "governance-findings-queue";

export type ReviewPackageGovernanceFindingsLink = {
  readonly id: ReviewPackageGovernanceFindingsSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type ReviewPackageGovernanceFindingsVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly reviewPackageFindingsLink: ReviewPackageGovernanceFindingsLink;
  readonly governanceFindingsLink: ReviewPackageGovernanceFindingsLink;
};

export const REVIEW_PACKAGE_GOVERNANCE_FINDINGS_HEADING =
  "This review and the workspace findings queue are different views" as const;

export const REVIEW_PACKAGE_GOVERNANCE_FINDINGS_WHY_TWO =
  "This review's Findings tab lists findings for one architecture review package — triage and export within this review. The workspace findings queue is the risk register across reviews for disposition, ownership, and exception work. Disposition in the queue updates governance state; triage on the review tab does not replace cross-review disposition. Counts scoped to this review may not match workspace totals." as const;

export const REVIEW_PACKAGE_GOVERNANCE_FINDINGS_COMPACT_LINE =
  "This review's findings tab triages one package; the workspace findings queue disposes risks across reviews." as const;

/**
 * Peer from the findings queue without a review scope: Reviews hub, because review
 * findings are package-scoped (open Findings on a review from the list).
 */
export const REVIEW_PACKAGE_GOVERNANCE_FINDINGS_REVIEWS_PEER_LINK: ReviewPackageGovernanceFindingsLink =
  {
    id: "review-package-findings",
    label: "Reviews (open Findings tab)",
    href: REVIEWS_LIST_PATH,
    whenToUse: "Open an architecture review, then use Findings to triage this review's package.",
  };

/** Build vocabulary; pass runId when mounting on a review Findings tab or scoped queue. */
export function buildReviewPackageGovernanceFindingsVocabulary(
  runId?: string | null,
): ReviewPackageGovernanceFindingsVocabularyModel {
  const trimmed = runId?.trim() ?? "";

  const reviewPackageFindingsLink: ReviewPackageGovernanceFindingsLink =
    trimmed.length > 0
      ? {
          id: "review-package-findings",
          label: "This review's findings",
          href: buildReviewDetailFindingsTabHref(trimmed),
          whenToUse: "Triage and export findings within this architecture review package.",
        }
      : REVIEW_PACKAGE_GOVERNANCE_FINDINGS_REVIEWS_PEER_LINK;

  const governanceFindingsLink: ReviewPackageGovernanceFindingsLink = {
    id: "governance-findings-queue",
    label: "Workspace findings queue",
    href:
      trimmed.length > 0
        ? buildGovernanceFindingsQueueHref({ runId: trimmed, filter: "all" })
        : buildGovernanceFindingsQueueHref({ filter: "open" }),
    whenToUse:
      trimmed.length > 0
        ? "Disposition risks and assign owners for this review in the workspace register."
        : "Disposition risks, assign owners, and clear open governance items across reviews.",
  };

  return {
    heading: REVIEW_PACKAGE_GOVERNANCE_FINDINGS_HEADING,
    whyTwo: REVIEW_PACKAGE_GOVERNANCE_FINDINGS_WHY_TWO,
    compactLine: REVIEW_PACKAGE_GOVERNANCE_FINDINGS_COMPACT_LINE,
    reviewPackageFindingsLink,
    governanceFindingsLink,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveReviewPackageGovernanceFindingsPeerLink(
  currentSurfaceId: ReviewPackageGovernanceFindingsSurfaceId,
  model: ReviewPackageGovernanceFindingsVocabularyModel,
): ReviewPackageGovernanceFindingsLink {
  if (currentSurfaceId === "review-package-findings") {
    return model.governanceFindingsLink;
  }

  return model.reviewPackageFindingsLink;
}
