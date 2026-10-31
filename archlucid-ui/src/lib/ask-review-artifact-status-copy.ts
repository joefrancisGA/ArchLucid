export const ASK_REVIEW_ARTIFACT_STATUS_FINALIZED =
  "Finalized architecture review — answers use the sealed record." as const;

export const ASK_REVIEW_ARTIFACT_STATUS_DRAFT =
  "Draft review context — answers are advisory until the review is finalized." as const;

export const ASK_REVIEW_ARTIFACT_STATUS_MISSING =
  "No architecture review selected — choose a finalized review before relying on answers." as const;

export const ASK_REVIEW_UNCITED_RESPONSE_MARKER =
  "No cited findings linked to this answer." as const;

export const ASK_REVIEW_ARTIFACT_STATUS_UNSPECIFIED = "Finalized state was not stored." as const;

export const ASK_REVIEW_GROUNDING_LINKS_NOT_STORED_MARKER =
  "Cited findings were not stored." as const;

export const ASK_CITATION_REFS_NOT_STORED_MARKER =
  "Citation refs were not stored on this answer." as const;

export const ASK_CITATION_FINDINGS_NOT_STORED_MARKER = "Cited findings were not stored." as const;

export const ASK_CITATION_DECISIONS_NOT_STORED_MARKER = "Cited decisions were not stored." as const;

export const ASK_CITATION_ARTIFACTS_NOT_STORED_MARKER = "Cited artifacts were not stored." as const;

export const ASK_CITATION_FINDINGS_STORED_EMPTY_MARKER = "Cited findings were stored empty." as const;

export const ASK_CITATION_DECISIONS_STORED_EMPTY_MARKER = "Cited decisions were stored empty." as const;

export const ASK_CITATION_ARTIFACTS_STORED_EMPTY_MARKER = "Cited artifacts were stored empty." as const;

export const ASK_CITATION_LISTS_NOT_STORED_MARKER = "Citation lists were not stored." as const;

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

export function messageHasUncitedAssistantOutput(content: string, citationIdCount: number): boolean {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return citationIdCount <= 0;
}

export function countAskAnswerCitationIds(input: {
  readonly referencedFindings?: readonly string[] | null;
  readonly referencedDecisions?: readonly string[] | null;
  readonly referencedArtifacts?: readonly string[] | null;
} | null): number {
  if (input === null) {
    return 0;
  }

  return (
    (input.referencedFindings?.length ?? 0)
    + (input.referencedDecisions?.length ?? 0)
    + (input.referencedArtifacts?.length ?? 0)
  );
}

/** Live marker under assistant answers when citation refs are omitted vs stored empty (not review navigation shortcuts). */
export function resolveAskAssistantGroundingCitationMarker(
  content: string,
  citationRefs: {
    readonly referencedFindings?: readonly string[] | null;
    readonly referencedDecisions?: readonly string[] | null;
    readonly referencedArtifacts?: readonly string[] | null;
  } | null,
): string | null {
  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (citationRefs === null) {
    return ASK_REVIEW_GROUNDING_LINKS_NOT_STORED_MARKER;
  }

  const findingsOmitted = citationRefs.referencedFindings == null;
  const decisionsOmitted = citationRefs.referencedDecisions == null;
  const artifactsOmitted = citationRefs.referencedArtifacts == null;

  if (findingsOmitted && decisionsOmitted && artifactsOmitted) {
    return ASK_CITATION_LISTS_NOT_STORED_MARKER;
  }

  if (countAskAnswerCitationIds(citationRefs) > 0) {
    return null;
  }

  const messages: string[] = [];

  if (findingsOmitted) {
    messages.push(ASK_CITATION_FINDINGS_NOT_STORED_MARKER);
  } else if (citationRefs.referencedFindings.length === 0) {
    messages.push(ASK_CITATION_FINDINGS_STORED_EMPTY_MARKER);
  }

  if (decisionsOmitted) {
    messages.push(ASK_CITATION_DECISIONS_NOT_STORED_MARKER);
  } else if (citationRefs.referencedDecisions.length === 0) {
    messages.push(ASK_CITATION_DECISIONS_STORED_EMPTY_MARKER);
  }

  if (artifactsOmitted) {
    messages.push(ASK_CITATION_ARTIFACTS_NOT_STORED_MARKER);
  } else if (citationRefs.referencedArtifacts.length === 0) {
    messages.push(ASK_CITATION_ARTIFACTS_STORED_EMPTY_MARKER);
  }

  if (messages.length > 0) {
    return messages.join(" ");
  }

  if (countAskAnswerCitationIds(citationRefs) <= 0) {
    return ASK_REVIEW_UNCITED_RESPONSE_MARKER;
  }

  return null;
}

export function messageCitationLinksNotStored(groundingLinkCount: number | null): boolean {
  return groundingLinkCount === null;
}
