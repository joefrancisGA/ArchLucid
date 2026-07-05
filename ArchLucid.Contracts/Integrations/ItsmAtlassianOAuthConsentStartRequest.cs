namespace ArchLucid.Contracts.Integrations;

public sealed class ItsmAtlassianOAuthConsentStartRequest
{
    public required string InstanceBaseUrl { get; init; }

    public string? RedirectUri { get; init; }

    public required string OAuthClientIdKeyVaultSecretName { get; init; }

    public required string OAuthClientSecretKeyVaultSecretName { get; init; }

    public required string OAuthRefreshTokenKeyVaultSecretName { get; init; }

    public string? InboundWebhookKeyVaultSecretName { get; init; }

    public string? Label { get; init; }
}
