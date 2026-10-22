import type { components } from "@/lib/openapi-schemas";

type TenantTrialStatusResponseSchema = components["schemas"]["TenantTrialStatusResponse"];

/** Subset of `GET /v1/tenant/trial-status` used by operator trial banners and tenant settings. */
export type TenantTrialStatusPayload = TenantTrialStatusResponseSchema &
  Required<Pick<TenantTrialStatusResponseSchema, "status" | "trialRunsUsed" | "identityHandoffPending">>;
