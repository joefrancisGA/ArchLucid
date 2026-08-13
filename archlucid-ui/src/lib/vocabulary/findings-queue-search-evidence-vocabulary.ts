/**
 * TB-2261 — Findings queue ≠ Search review evidence vocabulary rail.
 *
 * Why two “find evidence” surfaces exist:
 * - Findings queue (`/governance/findings`) is the governance triage inbox for
 *   dispositioning risks, assigning owners, and clearing open items.
 * - Search review evidence (`/insights/search-review-evidence`) retrieves
 *   findings, decisions, and signed review records across architecture packages
 *   in the evidence trail.
 *
 * They stay separate because triage disposition is not the same task as
 * cross-package retrieval. Distinct from Ask ↔ Search (TB-2231): Ask answers
 * questions with citations; this rail pairs the findings queue with Search.
 */

import { GOVERNANCE_FINDINGS_CANONICAL_PATH } from "@/lib/governance/governance-findings-evidence-copy";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

export type FindingsQueueSearchEvidenceSurfaceId = "findings-queue" | "search-evidence";

export type FindingsQueueSearchEvidenceLink = {
  readonly id: FindingsQueueSearchEvidenceSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type FindingsQueueSearchEvidenceVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly findingsQueueLink: FindingsQueueSearchEvidenceLink;
  readonly searchEvidenceLink: FindingsQueueSearchEvidenceLink;
};

export const FINDINGS_QUEUE_SEARCH_EVIDENCE_HEADING =
  "Findings queue and Search review evidence serve different purposes" as const;

export const FINDINGS_QUEUE_SEARCH_EVIDENCE_WHY_TWO =
  "The findings queue is the governance triage inbox for dispositioning risks, assigning owners, and clearing open items. Search review evidence finds findings, decisions, and signed review records across architecture packages in the evidence trail. Use the findings queue to triage; open Search when you need to locate evidence across packages." as const;

export const FINDINGS_QUEUE_SEARCH_EVIDENCE_COMPACT_LINE =
  "Findings queue triages risks; Search finds evidence across architecture packages — open the other when you need both." as const;

export const FINDINGS_QUEUE_SEARCH_EVIDENCE_FINDINGS_LINK: FindingsQueueSearchEvidenceLink = {
  id: "findings-queue",
  label: "Findings queue",
  href: GOVERNANCE_FINDINGS_CANONICAL_PATH,
  whenToUse: "Disposition risks, assign owners, and clear open governance items.",
};

export const FINDINGS_QUEUE_SEARCH_EVIDENCE_SEARCH_LINK: FindingsQueueSearchEvidenceLink = {
  id: "search-evidence",
  label: "Search review evidence",
  href: SEARCH_REVIEW_EVIDENCE_PATH,
  whenToUse: "Find findings, decisions, and signed review records across architecture packages.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildFindingsQueueSearchEvidenceVocabulary(): FindingsQueueSearchEvidenceVocabularyModel {
  return {
    heading: FINDINGS_QUEUE_SEARCH_EVIDENCE_HEADING,
    whyTwo: FINDINGS_QUEUE_SEARCH_EVIDENCE_WHY_TWO,
    compactLine: FINDINGS_QUEUE_SEARCH_EVIDENCE_COMPACT_LINE,
    findingsQueueLink: FINDINGS_QUEUE_SEARCH_EVIDENCE_FINDINGS_LINK,
    searchEvidenceLink: FINDINGS_QUEUE_SEARCH_EVIDENCE_SEARCH_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveFindingsQueueSearchEvidencePeerLink(
  currentSurfaceId: FindingsQueueSearchEvidenceSurfaceId,
): FindingsQueueSearchEvidenceLink {
  if (currentSurfaceId === "findings-queue") {
    return FINDINGS_QUEUE_SEARCH_EVIDENCE_SEARCH_LINK;
  }

  return FINDINGS_QUEUE_SEARCH_EVIDENCE_FINDINGS_LINK;
}
