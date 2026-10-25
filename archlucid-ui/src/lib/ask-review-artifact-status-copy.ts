export const ASK_REVIEW_ARTIFACT_STATUS_FINALIZED =
  "Grounded in a finalized architecture review — citations link to committed evidence." as const;

export const ASK_REVIEW_ARTIFACT_STATUS_DRAFT =
  "Draft review context — answers are advisory until the review is finalized." as const;

export const ASK_REVIEW_ARTIFACT_STATUS_MISSING =
  "No architecture review selected — choose a finalized review before relying on answers." as const;

export const ASK_REVIEW_UNCITED_RESPONSE_MARKER =
  "No cited findings linked — open evidence before signing off." as const;

export const ASK_REVIEW_GROUNDING_LINKS_NOT_STORED_MARKER =
  "Cited findings were not stored." as const;

export const ASK_REVIEW_STREAMING_PROVISIONAL_MARKER =
  "Provisional answer — not part of the Finalized review record until finalized." as const;

export const ASK_REVIEW_ARTIFACT_STATUS_FINALIZED_LOADING =
  "Finalized status has not loaded." as const;

export type AskReviewArtifactStatus = "finalized" | "draft" | "missing" | "finalized-loading";

export function resolveAskReviewArtifactStatus(input: {
  readonly runMissing: boolean;
  readonly isFinalized?: boolean;
}): AskReviewArtifactStatus {
  if (input.runMissing) {
    return "missing";
  }

  if (input.isFinalized === undefined) {
    return "finalized-loading";
  }

  if (input.isFinalized === false) {
    return "draft";
  }

  return "finalized";
}

export function askReviewArtifactStatusCopy(status: AskReviewArtifactStatus): string {
  switch (status) {
    case "finalized":
      return ASK_REVIEW_ARTIFACT_STATUS_FINALIZED;
    case "draft":
      return ASK_REVIEW_ARTIFACT_STATUS_DRAFT;
    case "missing":
      return ASK_REVIEW_ARTIFACT_STATUS_MISSING;
    case "finalized-loading":
      return ASK_REVIEW_ARTIFACT_STATUS_FINALIZED_LOADING;
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export function messageHasUncitedAssistantOutput(
  content: string,
  groundingLinkCount: number | null,
): boolean {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (groundingLinkCount === null) {
    return false;
  }

  return groundingLinkCount <= 0;
}

/** Live marker under assistant answers when grounding links are omitted vs stored empty. */
export function resolveAskAssistantGroundingCitationMarker(
  content: string,
  groundingLinks: readonly unknown[] | null,
): string | null {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (groundingLinks === null) {
    return ASK_REVIEW_GROUNDING_LINKS_NOT_STORED_MARKER;
  }

  if (groundingLinks.length <= 0) {
    return ASK_REVIEW_UNCITED_RESPONSE_MARKER;
  }

  return null;
}

export function messageCitationLinksNotStored(groundingLinkCount: number | null): boolean {
  return groundingLinkCount === null;
}
