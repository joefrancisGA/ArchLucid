import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { resolveArchitecturesListNavTitle } from "@/lib/operator/operator-nav-labels";

export type ArchitectureObjectMapFocus = "draft" | "review" | "sealed";

export const ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL = resolveArchitecturesListNavTitle();

export const ARCHITECTURE_OBJECT_MAP_REVIEW_LABEL = OPERATOR_NAV_LINK_LABELS.reviewPackage;

export const ARCHITECTURE_OBJECT_MAP_SEALED_LABEL = OPERATOR_NAV_LINK_LABELS.sealedReviewRecords;

const OBJECT_MAP_SENTENCES: Record<ArchitectureObjectMapFocus, string> = {
  draft: `You are viewing ${ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL.toLowerCase()}. Start a ${ARCHITECTURE_OBJECT_MAP_REVIEW_LABEL.toLowerCase()} to assess one; finalized reviews become ${ARCHITECTURE_OBJECT_MAP_SEALED_LABEL.toLowerCase()}.`,
  review: `You are viewing ${ARCHITECTURE_OBJECT_MAP_REVIEW_LABEL.toLowerCase()}. They begin as ${ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL.toLowerCase()} and become ${ARCHITECTURE_OBJECT_MAP_SEALED_LABEL.toLowerCase()} after finalize.`,
  sealed: `You are viewing ${ARCHITECTURE_OBJECT_MAP_SEALED_LABEL.toLowerCase()}. They come from finalized ${ARCHITECTURE_OBJECT_MAP_REVIEW_LABEL.toLowerCase()}; new work starts as ${ARCHITECTURE_OBJECT_MAP_DRAFT_LABEL.toLowerCase()}.`,
};

export function formatArchitectureObjectMapSentence(focus: ArchitectureObjectMapFocus): string {
  return OBJECT_MAP_SENTENCES[focus];
}
