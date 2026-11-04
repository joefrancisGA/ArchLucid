import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";

const FINDING_TITLE_NOT_STORED = "Finding title was not stored." as const;

const FINDING_TITLE_MATCHES_ID =
  "Finding title matches the finding id. A separate title was not stored." as const;

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

  if (idTrimmed.length > 0 && titleTrimmed.toLowerCase() === idTrimmed.toLowerCase()) {
    return FINDING_TITLE_MATCHES_ID;
  }

  if (isUuidLike(titleTrimmed) && (idTrimmed.length === 0 || titleTrimmed === idTrimmed)) {
    return FINDING_TITLE_MATCHES_ID;
  }

  return titleTrimmed;
}

export function formatQuickDecisionFindingPolicyRuleIdLine(
  policyRuleId: string | null | undefined,
): string {
  if (policyRuleId === null || policyRuleId === undefined) {
    return "Policy rule id was not stored.";
  }

  if (policyRuleId.length === 0) {
    return "Policy rule id was stored empty.";
  }

  const trimmed = policyRuleId.trim();

  if (trimmed.length === 0) {
    return "Policy rule id was stored empty.";
  }

  return `Policy rule id: ${trimmed}`;
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

export function formatQuickDecisionFindingOwnerHelper(
  assignedToUserId: string | null | undefined,
  emptyLabel = "Owner was not stored.",
): string {
  if (assignedToUserId === null || assignedToUserId === undefined) {
    return "No owner name is stored on this finding.";
  }

  if (assignedToUserId.trim().length === 0) {
    return "Remediation owner was stored empty.";
  }

  const ownerDisplay = formatQuickDecisionFindingOwnerDisplay(assignedToUserId, emptyLabel);

  if (ownerDisplay === emptyLabel || ownerDisplay === "Owner was stored empty.") {
    return ownerDisplay === "Owner was stored empty."
      ? "Remediation owner was stored empty."
      : "No owner name is stored on this finding.";
  }

  if (ownerDisplay === "Owner display name was not stored.") {
    return "Owner id was stored without a display name.";
  }

  return "The person recorded as responsible for this finding.";
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
