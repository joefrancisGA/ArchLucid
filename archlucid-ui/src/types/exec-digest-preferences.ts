import type { components } from "@/lib/openapi-schemas";

type ExecDigestPreferencesResponseSchema = components["schemas"]["ExecDigestPreferencesResponse"];

export type ExecDigestPreferencesResponse = ExecDigestPreferencesResponseSchema &
  Required<
    Pick<
      ExecDigestPreferencesResponseSchema,
      | "schemaVersion"
      | "tenantId"
      | "isConfigured"
      | "emailEnabled"
      | "recipientEmails"
      | "ianaTimeZoneId"
      | "dayOfWeek"
      | "hourOfDay"
      | "updatedUtc"
    >
  >;

type ExecDigestPreferencesUpsertRequestSchema = components["schemas"]["ExecDigestPreferencesUpsertRequest"];

export type ExecDigestPreferencesUpsertRequest = ExecDigestPreferencesUpsertRequestSchema &
  Required<
    Pick<
      ExecDigestPreferencesUpsertRequestSchema,
      "emailEnabled" | "recipientEmails" | "ianaTimeZoneId" | "dayOfWeek" | "hourOfDay"
    >
  >;
