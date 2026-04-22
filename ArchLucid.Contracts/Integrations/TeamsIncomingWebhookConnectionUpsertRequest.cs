namespace ArchLucid.Contracts.Integrations;

/// <summary>Upsert body for <c>POST /v1/integrations/teams/connections</c> — stores a Key Vault secret *name* reference only.</summary>
public sealed class TeamsIncomingWebhookConnectionUpsertRequest
{
    /// <summary>Key Vault secret name (or fully qualified secret id without the secret *value*) used by Logic Apps / workers to resolve the Teams incoming webhook URL.</summary>
    public required string KeyVaultSecretName { get; init; }

    public string? Label { get; init; }
}
