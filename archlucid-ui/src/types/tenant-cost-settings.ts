import type { components } from "@/lib/openapi-schemas";

type TenantCostSettingsGetResponseSchema = components["schemas"]["TenantCostSettingsGetResponse"];

export type TenantCostSettingsResponse = TenantCostSettingsGetResponseSchema &
  Required<
    Pick<
      TenantCostSettingsGetResponseSchema,
      | "architectHourlyRateUsd"
      | "averageIncidentCostUsd"
      | "eaDiscountMultiplier"
      | "eaDiscountPercentage"
      | "isTenantConfigured"
      | "updatedUtc"
    >
  >;

export type TenantCostSettingsPutRequest = components["schemas"]["TenantCostSettingsPutRequest"];
