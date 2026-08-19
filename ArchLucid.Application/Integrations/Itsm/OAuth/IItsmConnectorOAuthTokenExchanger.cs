using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Application.Integrations.Itsm.OAuth;

/// <summary>Exchanges stored OAuth client credentials or refresh tokens for short-lived access tokens (TB-600).</summary>
public interface IItsmConnectorOAuthTokenExchanger
{
    Task<ItsmConnectorOAuthTokenExchangeResult?> TryExchangeAsync(
        TenantItsmConnectorProvider provider,
        ItsmConnectorAuthMode authMode,
        string instanceBaseUrl,
        string oauthClientId,
        string oauthClientSecret,
        string? oauthRefreshToken,
        CancellationToken cancellationToken);

    Task<ItsmConnectorOAuthTokenExchangeResult?> TryExchangeAuthorizationCodeAsync(
        string oauthClientId,
        string oauthClientSecret,
        string authorizationCode,
        string redirectUri,
        string codeVerifier,
        CancellationToken cancellationToken);
}
