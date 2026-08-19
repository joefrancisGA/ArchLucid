export type TenantCostEstimateResponse = {
  currency: string;
  tier: string;
  estimatedMonthlyUsdLow: number;
  estimatedMonthlyUsdHigh: number;
  factors: string[];
  methodologyNote: string;
};
