export const ASK_REVIEW_ARTIFACT_STATUS_FINALIZED =
  "Grounded in a finalized architecture review — citations link to committed evidence." as const;

export const ASK_REVIEW_ARTIFACT_STATUS_DRAFT =
  "Draft review context — answers are advisory until the review is finalized." as const;

export const ASK_REVIEW_ARTIFACT_STATUS_MISSING =
  "No architecture review selected — choose a finalized review before relying on answers." as const;

export const ASK_REVIEW_UNCITED_RESPONSE_MARKER =
  "Stored citation ids were not on this answer." as const;

export const ASK_REVIEW_ARTIFACT_STATUS_UNSPECIFIED = "Finalized state was not stored." as const;

export const ASK_REVIEW_STREAMING_PROVISIONAL_MARKER =
  "Provisional answer — not part of the Finalized review record until finalized." as const;

export type AskReviewArtifactStatus = "finalized" | "draft" | "missing" | "unspecified";

export function resolveAskReviewArtifactStatus(input: {
  readonly runMissing: boolean;
  readonly isFinalized?: boolean;
}): AskReviewArtifactStatus {
  if (input.runMissing) {
    return "missing";
  }

  if (input.isFinalized === true) {
    return "finalized";
  }

  if (input.isFinalized === false) {
    return "draft";
  }

  return "unspecified";
}

export function askReviewArtifactStatusCopy(status: AskReviewArtifactStatus): string {
  switch (status) {
    case "finalized":
      return ASK_REVIEW_ARTIFACT_STATUS_FINALIZED;
    case "draft":
      return ASK_REVIEW_ARTIFACT_STATUS_DRAFT;
    case "missing":
      return ASK_REVIEW_ARTIFACT_STATUS_MISSING;
    case "unspecified":
      return ASK_REVIEW_ARTIFACT_STATUS_UNSPECIFIED;
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export function messageHasUncitedAssistantOutput(content: string, groundingLinkCount: number): boolean {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return groundingLinkCount <= 0;
}
