using System.Net.Http.Headers;

using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <inheritdoc cref="IItsmOutboundHttpAuthenticator" />
public sealed class ItsmOutboundHttpAuthenticator(
    IItsmConnectorOAuthTokenExchanger tokenExchanger,
    ItsmConnectorOAuthAccessTokenCache tokenCache) : IItsmOutboundHttpAuthenticator
{
    private readonly IItsmConnectorOAuthTokenExchanger _tokenExchanger =
        tokenExchanger ?? throw new ArgumentNullException(nameof(tokenExchanger));

    private readonly ItsmConnectorOAuthAccessTokenCache _tokenCache =
        tokenCache ?? throw new ArgumentNullException(nameof(tokenCache));

    public async Task<AuthenticationHeaderValue?> TryCreateAuthorizationHeaderAsync(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        ResolvedItsmOutboundCredentials credentials,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(credentials);

        if (credentials.AuthMode is ItsmConnectorAuthMode.BasicApiToken)
        {
            if (string.IsNullOrWhiteSpace(credentials.BasicSecretValue))
                return null;

            if (provider is TenantItsmConnectorProvider.AzureBoards)
                return ItsmOutboundHttpAuthorizationHeaders.CreatePat(credentials.BasicSecretValue);

            if (string.IsNullOrWhiteSpace(credentials.BasicAuthUserName))
                return null;

            return ItsmOutboundHttpAuthorizationHeaders.CreateBasic(
                credentials.BasicAuthUserName,
                credentials.BasicSecretValue);
        }

        if (string.IsNullOrWhiteSpace(credentials.OAuthClientId)
            || string.IsNullOrWhiteSpace(credentials.OAuthClientSecret))
        {
            return null;
        }

        string cacheKey = ItsmConnectorOAuthAccessTokenCache.BuildCacheKey(tenantId, provider, credentials.AuthMode);

        if (_tokenCache.TryGet(cacheKey, out string cachedAccessToken))
            return ItsmOutboundHttpAuthorizationHeaders.CreateBearer(cachedAccessToken);

        ItsmConnectorOAuthTokenExchangeResult? exchanged = await _tokenExchanger.TryExchangeAsync(
            provider,
            credentials.AuthMode,
            credentials.InstanceBaseUrl,
            credentials.OAuthClientId,
            credentials.OAuthClientSecret,
            credentials.OAuthRefreshToken,
            cancellationToken).ConfigureAwait(false);

        if (exchanged is null || string.IsNullOrWhiteSpace(exchanged.AccessToken))
            return null;

        _tokenCache.Set(cacheKey, exchanged.AccessToken, exchanged.ExpiresAtUtc);

        return ItsmOutboundHttpAuthorizationHeaders.CreateBearer(exchanged.AccessToken);
    }
}
