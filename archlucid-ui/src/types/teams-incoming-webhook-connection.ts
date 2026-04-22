export type TeamsIncomingWebhookConnectionResponse = {
  tenantId: string;
  isConfigured: boolean;
  label: string | null;
  keyVaultSecretName: string | null;
  updatedUtc: string;
};

export type TeamsIncomingWebhookConnectionUpsertRequest = {
  keyVaultSecretName: string;
  label?: string | null;
};
