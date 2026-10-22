/** True when the landing summary reflects an existing Tier 2 connection (TB-1143). */
export function isCloudProviderSummaryConfigured(status: string): boolean {
  const normalized = status.trim().toLowerCase();

  return normalized.length > 0 && normalized !== "not configured";
}
