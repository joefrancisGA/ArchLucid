import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

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
