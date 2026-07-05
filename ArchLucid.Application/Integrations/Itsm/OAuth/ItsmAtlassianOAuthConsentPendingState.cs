using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Application.Integrations.Itsm.OAuth;

public sealed class ItsmAtlassianOAuthConsentPendingState
{
    public required Guid TenantId { get; init; }

    public required string CodeVerifier { get; init; }

    public required string RedirectUri { get; init; }

    public required string InstanceBaseUrl { get; init; }

    public required string OAuthClientIdKeyVaultSecretName { get; init; }

    public required string OAuthClientSecretKeyVaultSecretName { get; init; }

    public required string OAuthRefreshTokenKeyVaultSecretName { get; init; }

    public string? InboundWebhookKeyVaultSecretName { get; init; }

    public string? Label { get; init; }

    public DateTimeOffset ExpiresAtUtc { get; init; }
}
