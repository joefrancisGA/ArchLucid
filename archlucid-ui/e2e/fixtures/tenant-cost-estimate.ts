import type { TenantCostEstimateResponse } from "@/types/tenant-cost-estimate";

/** Mock tenant cost for screenshot / E2E when API is unreachable. */
export function fixtureTenantCostEstimate(): TenantCostEstimateResponse {
  return {
    currency: "USD",
    tier: "Standard (Healthcare workload)",
    estimatedMonthlyUsdLow: 480,
    estimatedMonthlyUsdHigh: 920,
    factors: [
      "Claims intake pipelines and PHI-adjacent storage (regulated regions)",
      "Architecture analysis agent runs proportional to finalized manifests",
      "Application Insights telemetry and archival retention assumptions",
    ],
    methodologyNote:
      "Demonstration estimate — reconcile with Azure Cost Management and invoicing before quoting externally.",
  };
}
