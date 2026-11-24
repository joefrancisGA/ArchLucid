import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

/** One sentence for the nouns a first session asks about. Not a second help rail. */
export const REVIEW_COGNITIVE_LOAD_GLOSSARY_LINE =
  "Evidence is what supports a finding. Finalize locks the review record. The sponsor packet is the export you send." as const;

export const REVIEW_COGNITIVE_LOAD_NEXT_ACTION_EVIDENCE =
  "Finish evidence, then finalize." as const;

export const REVIEW_COGNITIVE_LOAD_NEXT_ACTION_FINALIZE =
  "Finalize the review record, then open the sponsor packet." as const;

export const REVIEW_COGNITIVE_LOAD_NEXT_ACTION_SPONSOR =
  "Open the sponsor packet. This review record is ready to send." as const;

export const REVIEW_COGNITIVE_LOAD_NEXT_ACTION_CONTINUE =
  "Do the next action named below. The tabs stay for navigation." as const;

export const REVIEW_COGNITIVE_LOAD_EMPTY_EVIDENCE_LINE =
  "Evidence is empty until a capture is stored. Open the Evidence tab after collection finishes." as const;

export const REVIEW_COGNITIVE_LOAD_EMPTY_EXPORT_LINE =
  "The sponsor packet stays closed until you finalize. Open the Sponsor packet tab to finish the review record." as const;

export const REVIEW_COGNITIVE_LOAD_SPONSOR_PRIMARY_LABEL = "Open sponsor packet" as const;

export function resolveReviewCognitiveLoadNextAction(input: {
  readonly openGateReviewTab: ReviewDetailTabId | null;
  readonly openGateLabel: string | null;
  readonly evidenceReferenceCountNotStored: boolean;
}): string {
  if (input.evidenceReferenceCountNotStored || input.openGateReviewTab === "evidence") {
    return REVIEW_COGNITIVE_LOAD_NEXT_ACTION_EVIDENCE;
  }

  if (input.openGateReviewTab === "review-package") {
    return REVIEW_COGNITIVE_LOAD_NEXT_ACTION_FINALIZE;
  }

  if (input.openGateLabel === null) {
    return REVIEW_COGNITIVE_LOAD_NEXT_ACTION_SPONSOR;
  }

  return REVIEW_COGNITIVE_LOAD_NEXT_ACTION_CONTINUE;
}

export function resolveReviewCognitiveLoadEmptyLine(input: {
  readonly openGateReviewTab: ReviewDetailTabId | null;
  readonly evidenceReferenceCountNotStored: boolean;
}): string | null {
  if (input.evidenceReferenceCountNotStored || input.openGateReviewTab === "evidence") {
    return REVIEW_COGNITIVE_LOAD_EMPTY_EVIDENCE_LINE;
  }

  if (input.openGateReviewTab === "review-package") {
    return REVIEW_COGNITIVE_LOAD_EMPTY_EXPORT_LINE;
  }

  return null;
}
