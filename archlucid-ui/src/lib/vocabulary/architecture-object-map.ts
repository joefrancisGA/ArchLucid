import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export type ArchitectureObjectMapFocus = "draft" | "review" | "sealed";

/** Nav noun for `/architecture/architectures` — not the sidebar tooltip. */
export const ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL = OPERATOR_NAV_LINK_LABELS.architectures;

export const ARCHITECTURE_OBJECT_MAP_REVIEW_LABEL = OPERATOR_NAV_LINK_LABELS.reviewPackage;

export const ARCHITECTURE_OBJECT_MAP_SEALED_LABEL = OPERATOR_NAV_LINK_LABELS.sealedReviewRecords;

/**
 * TB-2354 — each hub names draft, review, and sealed record.
 * ADR 0067 — Review is not a step after an in-app draft. Architecture can arrive as a
 * description, imported documents, or an optional saved draft.
 */
const OBJECT_MAP_SENTENCES: Record<ArchitectureObjectMapFocus, string> = {
  draft: `You are viewing ${ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL.toLowerCase()}. Start a review to assess one; finalized reviews become ${ARCHITECTURE_OBJECT_MAP_SEALED_LABEL.toLowerCase()}.`,
  review: `${ARCHITECTURE_OBJECT_MAP_REVIEW_LABEL} start from architecture you already have — a description, imported documents, or optional ${ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL.toLowerCase()}. Finalize to generate ${ARCHITECTURE_OBJECT_MAP_SEALED_LABEL.toLowerCase()}.`,
  sealed: `You are viewing ${ARCHITECTURE_OBJECT_MAP_SEALED_LABEL.toLowerCase()}. They come from finalized ${ARCHITECTURE_OBJECT_MAP_REVIEW_LABEL.toLowerCase()}; new work can start as a review or as ${ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL.toLowerCase()}.`,
};

export function formatArchitectureObjectMapSentence(focus: ArchitectureObjectMapFocus): string {
  return OBJECT_MAP_SENTENCES[focus];
}
