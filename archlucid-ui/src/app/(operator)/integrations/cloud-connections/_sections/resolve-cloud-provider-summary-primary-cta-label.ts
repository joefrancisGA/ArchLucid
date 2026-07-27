/** Primary CTA copy for cloud provider landing cards (TB-1141). */
export function resolveCloudProviderSummaryPrimaryCtaLabel(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized.length === 0 || normalized === "not configured") {
    return "Configure";
  }

  return "Open connection";
}
