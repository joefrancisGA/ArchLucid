/**
 * TB-2231 — Ask ↔ Search evidence peer rail.
 *
 * Why two “evidence” surfaces exist:
 * - Ask (`/insights/ask-review-questions`) answers questions about a finalized
 *   review and cites evidence from the sealed review record.
 * - Search (`/insights/search-review-evidence`) finds findings, decisions, and
 *   sealed review records across architecture packages in the evidence trail.
 *
 * They stay separate because Q&A with citations is not the same task as
 * retrieval across packages. Do not confuse Search review evidence with the
 * header find-a-page control (`search-surface-disambiguation`).
 */

import { ASK_REVIEW_QUESTIONS_PATH } from "@/lib/ask-review-questions-route";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

export type AskSearchEvidenceSurfaceId = "ask" | "search";

export type AskSearchEvidenceLink = {
  readonly id: AskSearchEvidenceSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type AskSearchEvidenceVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly askLink: AskSearchEvidenceLink;
  readonly searchLink: AskSearchEvidenceLink;
};

export const ASK_SEARCH_EVIDENCE_HEADING = "Ask and Search serve different purposes" as const;

export const ASK_SEARCH_EVIDENCE_WHY_TWO =
  "Ask answers questions about a finalized review and cites evidence from the sealed review record. Search finds findings, decisions, and sealed review records across architecture packages in the evidence trail. Use Ask when you have a question; open Search when you need to locate evidence across packages." as const;

export const ASK_SEARCH_EVIDENCE_COMPACT_LINE =
  "Ask answers with citations; Search finds evidence across architecture packages — open the other when you need both." as const;

export const ASK_SEARCH_EVIDENCE_ASK_LINK: AskSearchEvidenceLink = {
  id: "ask",
  label: "Ask review questions",
  href: ASK_REVIEW_QUESTIONS_PATH,
  whenToUse: "Ask questions about a finalized review with cited evidence.",
};

export const ASK_SEARCH_EVIDENCE_SEARCH_LINK: AskSearchEvidenceLink = {
  id: "search",
  label: "Search review evidence",
  href: SEARCH_REVIEW_EVIDENCE_PATH,
  whenToUse: "Find findings, decisions, and sealed review records across architecture packages.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildAskSearchEvidenceVocabulary(): AskSearchEvidenceVocabularyModel {
  return {
    heading: ASK_SEARCH_EVIDENCE_HEADING,
    whyTwo: ASK_SEARCH_EVIDENCE_WHY_TWO,
    compactLine: ASK_SEARCH_EVIDENCE_COMPACT_LINE,
    askLink: ASK_SEARCH_EVIDENCE_ASK_LINK,
    searchLink: ASK_SEARCH_EVIDENCE_SEARCH_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveAskSearchEvidencePeerLink(
  currentSurfaceId: AskSearchEvidenceSurfaceId,
): AskSearchEvidenceLink {
  if (currentSurfaceId === "ask") {
    return ASK_SEARCH_EVIDENCE_SEARCH_LINK;
  }

  return ASK_SEARCH_EVIDENCE_ASK_LINK;
}
