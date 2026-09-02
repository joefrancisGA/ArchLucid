import type { components } from "@/lib/openapi-schemas";

type TenantCostEstimateResponseSchema = components["schemas"]["TenantCostEstimateResponse"];

export type TenantCostEstimateResponse = TenantCostEstimateResponseSchema &
  Required<
    Pick<
      TenantCostEstimateResponseSchema,
      | "currency"
      | "estimatedMonthlyUsdLow"
      | "estimatedMonthlyUsdHigh"
      | "factors"
      | "methodologyNote"
      | "tier"
    >
  >;
