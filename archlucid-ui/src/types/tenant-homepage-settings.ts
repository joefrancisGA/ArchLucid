import type { components } from "@/lib/openapi-schemas";

type TenantHomepageSettingsGetResponseSchema = components["schemas"]["TenantHomepageSettingsGetResponse"];

export type TenantHomepageSettingsResponse = TenantHomepageSettingsGetResponseSchema &
  Required<
    Pick<
      TenantHomepageSettingsGetResponseSchema,
      "selectedRunId" | "isConfigured" | "isAvailable" | "isSampleApproved"
    >
  >;

export type FeaturedCompletedSampleCandidate =
  components["schemas"]["FeaturedCompletedSampleCandidateResponse"];

export type TenantHomepageSettingsPutRequest = components["schemas"]["TenantHomepageSettingsPutRequest"];
