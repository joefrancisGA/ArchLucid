import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

const FINDING_TITLE_NOT_STORED = "Finding title was not stored." as const;

/** Avoid surfacing a stored finding id as if it were the reviewer-facing title. */
export function formatQuickDecisionFindingTitleDisplay(
  findingId: string,
  title: string,
): string {
  const idTrimmed = findingId.trim();
  const titleTrimmed = title.trim();

  if (titleTrimmed.length === 0) {
    return FINDING_TITLE_NOT_STORED;
  }

  if (idTrimmed.length > 0 && titleTrimmed === idTrimmed) {
    return FINDING_TITLE_NOT_STORED;
  }

  if (isUuidLike(titleTrimmed) && (idTrimmed.length === 0 || titleTrimmed === idTrimmed)) {
    return FINDING_TITLE_NOT_STORED;
  }

  return titleTrimmed;
}

export function formatQuickDecisionFindingCategoryLine(
  category: string | null | undefined,
): string {
  if (category === null || category === undefined) {
    return "Finding category was not stored.";
  }

  if (category.trim().length === 0) {
    return "Finding category was stored empty.";
  }

  return category.trim();
}

export function formatQuickDecisionFindingOwnerDisplay(
  assignedToUserId: string | null | undefined,
  emptyLabel = "Owner was not stored.",
): string {
  if (assignedToUserId === null || assignedToUserId === undefined) {
    return emptyLabel;
  }

  if (assignedToUserId.trim().length === 0) {
    return "Owner was stored empty.";
  }

  const owner = assignedToUserId.trim();

  if (isUuidLike(owner)) {
    return "Owner display name was not stored.";
  }

  return owner;
}

export function isKnownQuickDecisionConfidenceLevel(
  confidenceLevel: string | null | undefined,
): confidenceLevel is "High" | "Medium" | "Low" {
  return confidenceLevel === "High" || confidenceLevel === "Medium" || confidenceLevel === "Low";
}

export function formatQuickDecisionConfidenceWorkspaceLabel(
  confidenceLevel: string | null | undefined,
): string {
  if (confidenceLevel === null || confidenceLevel === undefined) {
    return "Confidence level was not stored.";
  }

  const trimmed = confidenceLevel.trim();

  if (trimmed.length === 0) {
    return "Confidence was stored empty.";
  }

  if (isKnownQuickDecisionConfidenceLevel(trimmed)) {
    return trimmed;
  }

  return `Confidence ${trimmed} has no reviewer label.`;
}
