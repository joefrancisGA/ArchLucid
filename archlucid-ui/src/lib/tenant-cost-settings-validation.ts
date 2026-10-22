function parseUsdField(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return value;
}

export type TenantCostSettingsFieldValidation = {
  readonly valid: boolean;
  readonly hourlyError: string | null;
  readonly incidentError: string | null;
  readonly eaError: string | null;
};

/** Live client validation for tenant ROI cost settings (TB-2008). */
export function validateTenantCostSettingsFields(
  hourlyRate: string,
  incidentCost: string,
  eaDiscountPercentage: string,
): TenantCostSettingsFieldValidation {
  const architectHourlyRateUsd = parseUsdField(hourlyRate);
  const averageIncidentCostUsd = parseUsdField(incidentCost);
  const eaDiscountPct = parseUsdField(eaDiscountPercentage);

  let hourlyError: string | null = null;
  let incidentError: string | null = null;
  let eaError: string | null = null;

  if (
    architectHourlyRateUsd === null ||
    Number.isNaN(architectHourlyRateUsd) ||
    architectHourlyRateUsd <= 0
  ) {
    hourlyError = "Enter a USD amount greater than zero.";
  }

  if (
    averageIncidentCostUsd === null ||
    Number.isNaN(averageIncidentCostUsd) ||
    averageIncidentCostUsd <= 0
  ) {
    incidentError = "Enter a USD amount greater than zero.";
  }

  if (eaDiscountPct === null || Number.isNaN(eaDiscountPct) || eaDiscountPct < 0 || eaDiscountPct > 100) {
    eaError = "EA discount percentage must be between 0 and 100.";
  }

  return {
    valid: hourlyError === null && incidentError === null && eaError === null,
    hourlyError,
    incidentError,
    eaError,
  };
}
