/** Normalize API percent fields that may be 0–100 or 0–1 fractions (UU-441). */
export function formatRemediationFactoryPercentDisplay(value: number): string {
  const normalized = value > 0 && value <= 1 ? value * 100 : value;

  return formatRemediationFactoryPercentPoints(normalized);
}

/** Formats a value already expressed on the API's 0–100 scale. */
export function formatRemediationFactoryPercentPoints(value: number): string {
  return `${Math.round(value)}%`;
}

export const REMEDIATION_FACTORY_PERCENT_POPULATION_LINE =
  "Share of open operational findings in this workspace (rule IE15-priority-v1)." as const;
