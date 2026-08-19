using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

using ArchLucid.Core.Integrations.Itsm;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Integrations.Itsm.OAuth;

/// <summary>OAuth 2.0 token exchange for Jira (Atlassian) and ServiceNow first-party connectors (TB-600).</summary>
public sealed class ItsmConnectorOAuthTokenExchanger(HttpClient http, ILogger<ItsmConnectorOAuthTokenExchanger> logger)
    : IItsmConnectorOAuthTokenExchanger
{
    private static readonly Uri AtlassianTokenEndpoint = new("https://auth.atlassian.com/oauth/token");

    private readonly HttpClient _http = http ?? throw new ArgumentNullException(nameof(http));
    private readonly ILogger<ItsmConnectorOAuthTokenExchanger> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<ItsmConnectorOAuthTokenExchangeResult?> TryExchangeAsync(
        TenantItsmConnectorProvider provider,
        ItsmConnectorAuthMode authMode,
        string instanceBaseUrl,
        string oauthClientId,
        string oauthClientSecret,
        string? oauthRefreshToken,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(instanceBaseUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(oauthClientId);
        ArgumentException.ThrowIfNullOrWhiteSpace(oauthClientSecret);

        if (authMode is ItsmConnectorAuthMode.BasicApiToken)
            return null;

        Dictionary<string, string> form = authMode switch
        {
            ItsmConnectorAuthMode.OAuth2ClientCredentials => new()
            {
                ["grant_type"] = "client_credentials",
                ["client_id"] = oauthClientId.Trim(),
                ["client_secret"] = oauthClientSecret.Trim()
            },
            ItsmConnectorAuthMode.OAuth2RefreshToken => new()
            {
                ["grant_type"] = "refresh_token",
                ["client_id"] = oauthClientId.Trim(),
                ["client_secret"] = oauthClientSecret.Trim(),
                ["refresh_token"] = oauthRefreshToken?.Trim() ?? ""
            },
            _ => throw new ArgumentOutOfRangeException(nameof(authMode), authMode, null)
        };

        if (authMode is ItsmConnectorAuthMode.OAuth2RefreshToken && string.IsNullOrWhiteSpace(form["refresh_token"]))
            return null;

        Uri tokenEndpoint = ResolveTokenEndpoint(provider, instanceBaseUrl);

        using HttpRequestMessage request = new(HttpMethod.Post, tokenEndpoint);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Content = new FormUrlEncodedContent(form);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "ITSM OAuth token exchange failed: transport error for {Provider}.", provider);

            return null;
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(
                        "ITSM OAuth token exchange failed for {Provider}: HTTP {StatusCode}.",
                        provider,
                        (int)response.StatusCode);

                return null;
            }

            OAuthTokenResponse? parsed = await response.Content
                .ReadFromJsonAsync<OAuthTokenResponse>(cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (parsed is null || string.IsNullOrWhiteSpace(parsed.AccessToken))
                return null;

            int expiresInSeconds = parsed.ExpiresIn is > 0 ? parsed.ExpiresIn.Value : 3600;

            return new ItsmConnectorOAuthTokenExchangeResult
            {
                AccessToken = parsed.AccessToken.Trim(),
                ExpiresAtUtc = TimeProvider.System.GetUtcNow().AddSeconds(expiresInSeconds),
                RefreshToken = string.IsNullOrWhiteSpace(parsed.RefreshToken) ? null : parsed.RefreshToken.Trim()
            };
        }
    }

    public async Task<ItsmConnectorOAuthTokenExchangeResult?> TryExchangeAuthorizationCodeAsync(
        string oauthClientId,
        string oauthClientSecret,
        string authorizationCode,
        string redirectUri,
        string codeVerifier,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(oauthClientId);
        ArgumentException.ThrowIfNullOrWhiteSpace(oauthClientSecret);
        ArgumentException.ThrowIfNullOrWhiteSpace(authorizationCode);
        ArgumentException.ThrowIfNullOrWhiteSpace(redirectUri);
        ArgumentException.ThrowIfNullOrWhiteSpace(codeVerifier);

        Dictionary<string, string> form = new()
        {
            ["grant_type"] = "authorization_code",
            ["client_id"] = oauthClientId.Trim(),
            ["client_secret"] = oauthClientSecret.Trim(),
            ["code"] = authorizationCode.Trim(),
            ["redirect_uri"] = redirectUri.Trim(),
            ["code_verifier"] = codeVerifier.Trim()
        };

        using HttpRequestMessage request = new(HttpMethod.Post, AtlassianTokenEndpoint);
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Content = new FormUrlEncodedContent(form);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "Atlassian OAuth authorization-code exchange failed: transport error.");

            return null;
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                    _logger.LogWarning(
                        "Atlassian OAuth authorization-code exchange failed: HTTP {StatusCode}.",
                        (int)response.StatusCode);

                return null;
            }

            OAuthTokenResponse? parsed = await response.Content
                .ReadFromJsonAsync<OAuthTokenResponse>(cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (parsed is null || string.IsNullOrWhiteSpace(parsed.AccessToken))
                return null;

            int expiresInSeconds = parsed.ExpiresIn is > 0 ? parsed.ExpiresIn.Value : 3600;

            return new ItsmConnectorOAuthTokenExchangeResult
            {
                AccessToken = parsed.AccessToken.Trim(),
                ExpiresAtUtc = TimeProvider.System.GetUtcNow().AddSeconds(expiresInSeconds),
                RefreshToken = string.IsNullOrWhiteSpace(parsed.RefreshToken) ? null : parsed.RefreshToken.Trim()
            };
        }
    }

    private static Uri ResolveTokenEndpoint(TenantItsmConnectorProvider provider, string instanceBaseUrl) =>
        provider switch
        {
            TenantItsmConnectorProvider.Jira => AtlassianTokenEndpoint,
            TenantItsmConnectorProvider.ServiceNow => new Uri($"{instanceBaseUrl.Trim().TrimEnd('/')}/oauth_token.do"),
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };

    private sealed class OAuthTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string? AccessToken
        {
            get;
            init;
        }

        [JsonPropertyName("expires_in")]
        public int? ExpiresIn
        {
            get;
            init;
        }

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken
        {
            get;
            init;
        }
    }
}
