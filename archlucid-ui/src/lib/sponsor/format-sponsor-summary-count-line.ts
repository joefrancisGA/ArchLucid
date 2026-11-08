export function formatSponsorSummaryFiniteCountLine(
  label: string,
  value: number | null | undefined,
  notStoredSentence: string,
): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `- **${label}:** ${value}`;
  }

  return `- **${label}:** ${notStoredSentence}`;
}

export function formatSponsorSummaryOptionalStringLine(
  label: string,
  value: string | null | undefined,
  notStoredSentence: string,
): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return `- **${label}:** ${value.trim()}`;
  }

  return `- **${label}:** ${notStoredSentence}`;
}
