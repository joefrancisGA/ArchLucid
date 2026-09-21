import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export const REMEDIATION_PATTERN_STATUS = {
  draft: 0,
  underReview: 1,
  approved: 2,
  deprecated: 3,
  retired: 4,
} as const;

export function remediationPatternStatusKind(status: number | undefined): EnterpriseStatusKind {
  switch (status) {
    case REMEDIATION_PATTERN_STATUS.approved:
      return "ready";
    case REMEDIATION_PATTERN_STATUS.underReview:
      return "in-progress";
    case REMEDIATION_PATTERN_STATUS.draft:
      return "neutral";
    case REMEDIATION_PATTERN_STATUS.deprecated:
      return "needs-attention";
    case REMEDIATION_PATTERN_STATUS.retired:
      return "blocked";
    default:
      return "neutral";
  }
}

export function formatRemediationPatternAutomationLevel(
  automationLevel: number | string | undefined,
): string {
  if (automationLevel === undefined || automationLevel === null) {
    return "—";
  }

  if (typeof automationLevel === "string") {
    const trimmed = automationLevel.trim();

    if (trimmed.length === 0) {
      return "—";
    }

    switch (trimmed) {
      case "Manual":
        return "Manual";
      case "Guided":
        return "Guided";
      case "SemiAutomated":
        return "Semi-automated";
      case "Automated":
        return "Automated";
      default:
        return trimmed;
    }
  }

  switch (automationLevel) {
    case 0:
      return "Manual";
    case 1:
      return "Guided";
    case 2:
      return "Semi-automated";
    case 3:
      return "Automated";
    default:
      return String(automationLevel);
  }
}

export function remediationPatternStatusLabel(status: number | undefined): string {
  switch (status) {
    case REMEDIATION_PATTERN_STATUS.draft:
      return "Draft";
    case REMEDIATION_PATTERN_STATUS.underReview:
      return "Under review";
    case REMEDIATION_PATTERN_STATUS.approved:
      return "Approved";
    case REMEDIATION_PATTERN_STATUS.deprecated:
      return "Deprecated";
    case REMEDIATION_PATTERN_STATUS.retired:
      return "Retired";
    default:
      return "Unknown";
  }
}
