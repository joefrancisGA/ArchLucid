export const REMEDIATION_PATTERN_STATUS = {
  draft: 0,
  underReview: 1,
  approved: 2,
  deprecated: 3,
  retired: 4,
} as const;

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
