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

export function formatQuickDecisionFindingOwnerDisplay(
  assignedToUserId: string | null | undefined,
  emptyLabel = "Owner was not stored.",
): string {
  const owner = assignedToUserId?.trim() ?? "";

  if (owner.length === 0) {
    return emptyLabel;
  }

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

export function formatQuickDecisionFindingSeverityDisplay(severity: string | null | undefined): string {
  if (severity === null || severity === undefined) {
    return "Severity was not stored.";
  }

  const trimmed = severity.trim();

  if (trimmed.length === 0) {
    return "Severity was stored empty.";
  }

  return trimmed;
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
