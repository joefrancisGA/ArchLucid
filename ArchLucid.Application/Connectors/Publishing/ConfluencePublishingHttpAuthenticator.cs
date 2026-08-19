using System.Net.Http.Headers;

using ArchLucid.Application.Integrations.Itsm.OAuth;
using ArchLucid.Application.Integrations.Itsm.Outbound;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Connectors.Publishing;

/// <inheritdoc cref="IConfluencePublishingHttpAuthenticator" />
public sealed class ConfluencePublishingHttpAuthenticator(
    IOptionsMonitor<ConfluencePublishingOptions> options,
    IItsmConnectorOAuthTokenExchanger tokenExchanger,
    ItsmConnectorOAuthAccessTokenCache tokenCache) : IConfluencePublishingHttpAuthenticator
{
    private const string DeploymentCacheKey = "confluence:publishing:deployment";

    private readonly IOptionsMonitor<ConfluencePublishingOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IItsmConnectorOAuthTokenExchanger _tokenExchanger =
        tokenExchanger ?? throw new ArgumentNullException(nameof(tokenExchanger));

    private readonly ItsmConnectorOAuthAccessTokenCache _tokenCache =
        tokenCache ?? throw new ArgumentNullException(nameof(tokenCache));

    public async Task<AuthenticationHeaderValue?> TryCreateAuthorizationHeaderAsync(CancellationToken cancellationToken)
    {
        ConfluencePublishingOptions o = _options.CurrentValue;

        if (o.AuthMode is ItsmConnectorAuthMode.BasicApiToken)
        {
            if (string.IsNullOrWhiteSpace(o.ServiceAccountEmail) || string.IsNullOrWhiteSpace(o.ApiToken))
                return null;

            return ItsmOutboundHttpAuthorizationHeaders.CreateBasic(o.ServiceAccountEmail, o.ApiToken);
        }

        if (string.IsNullOrWhiteSpace(o.OAuthClientId) || string.IsNullOrWhiteSpace(o.OAuthClientSecret))
            return null;

        if (o.AuthMode is ItsmConnectorAuthMode.OAuth2RefreshToken
            && string.IsNullOrWhiteSpace(o.OAuthRefreshToken))
        {
            return null;
        }

        if (_tokenCache.TryGet(DeploymentCacheKey, out string cachedAccessToken))
            return ItsmOutboundHttpAuthorizationHeaders.CreateBearer(cachedAccessToken);

        string cloudBaseUrl = o.CloudBaseUrl.Trim().TrimEnd('/');

        if (cloudBaseUrl.Length is 0)
            return null;

        ItsmConnectorOAuthTokenExchangeResult? exchanged = await _tokenExchanger.TryExchangeAsync(
            TenantItsmConnectorProvider.Jira,
            o.AuthMode,
            cloudBaseUrl,
            o.OAuthClientId,
            o.OAuthClientSecret,
            o.OAuthRefreshToken,
            cancellationToken).ConfigureAwait(false);

        if (exchanged is null || string.IsNullOrWhiteSpace(exchanged.AccessToken))
            return null;

        _tokenCache.Set(DeploymentCacheKey, exchanged.AccessToken, exchanged.ExpiresAtUtc);

        return ItsmOutboundHttpAuthorizationHeaders.CreateBearer(exchanged.AccessToken);
    }
}
