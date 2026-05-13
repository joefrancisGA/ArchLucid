/** Formats an estimated USD amount for cost tables (falls back if `Intl` rejects the currency). */
export function formatCostReportingEstimatedUsd(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`;
  }
}
