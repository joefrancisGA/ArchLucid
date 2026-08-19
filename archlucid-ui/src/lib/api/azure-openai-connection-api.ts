export type TenantAzureOpenAiConnectionResponse = {
  tenantId: string;
  isConfigured: boolean;
  providerConnectionId?: string | null;
  endpoint?: string | null;
  authMode: string;
  apiKeyKeyVaultSecretName?: string | null;
  deploymentsJson?: string | null;
  isEnabled: boolean;
  label?: string | null;
  lastProbeSucceeded?: boolean | null;
  lastProbeMessage?: string | null;
  lastProbeUtc?: string | null;
  updatedUtc?: string | null;
};

export type TenantAzureOpenAiConnectionUpsertRequest = {
  endpoint?: string;
  authMode?: string;
  apiKeyKeyVaultSecretName?: string;
  apiKey?: string;
  deploymentsJson?: string;
  isEnabled?: boolean;
  label?: string;
};

export type TenantAzureOpenAiConnectionProbeResponse = {
  succeeded: boolean;
  message: string;
};

export const AZURE_OPENAI_CONNECTION_ENDPOINT =
  "/api/proxy/v1/admin/settings/azure-openai-connection";

export const AZURE_OPENAI_CONNECTION_PROBE_ENDPOINT =
  "/api/proxy/v1/admin/settings/azure-openai-connection/probe";
