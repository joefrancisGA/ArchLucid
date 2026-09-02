import type { components } from "@/lib/openapi-schemas";

type TeamsIncomingWebhookConnectionResponseSchema =
  components["schemas"]["TeamsIncomingWebhookConnectionResponse"];

export type TeamsIncomingWebhookConnectionResponse = TeamsIncomingWebhookConnectionResponseSchema &
  Required<
    Pick<
      TeamsIncomingWebhookConnectionResponseSchema,
      "tenantId" | "isConfigured" | "label" | "keyVaultSecretName" | "enabledTriggers" | "updatedUtc"
    >
  >;

export type TeamsIncomingWebhookConnectionUpsertRequest =
  components["schemas"]["TeamsIncomingWebhookConnectionUpsertRequest"];

export type TeamsIncomingWebhookSecretValidationOutcome =
  components["schemas"]["TeamsIncomingWebhookSecretValidationOutcome"];

type TeamsIncomingWebhookSecretValidationResponseSchema =
  components["schemas"]["TeamsIncomingWebhookSecretValidationResponse"];

export type TeamsIncomingWebhookSecretValidationResponse = Omit<
  TeamsIncomingWebhookSecretValidationResponseSchema,
  "outcome"
> &
  Required<Pick<TeamsIncomingWebhookSecretValidationResponseSchema, "message">> & {
    outcome: TeamsIncomingWebhookSecretValidationOutcome;
  };

export type TeamsIncomingWebhookConnectionTestResponse =
  components["schemas"]["TeamsIncomingWebhookConnectionTestResponse"];
