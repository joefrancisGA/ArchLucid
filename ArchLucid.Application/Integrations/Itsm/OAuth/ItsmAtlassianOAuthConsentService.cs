using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;
using ArchLucid.Core.IntegrationSecrets;
using ArchLucid.Core.Secrets;

using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm.OAuth;

public sealed class ItsmAtlassianOAuthConsentService(
    IOptions<IntegrationsAtlassianOAuthOptions> atlassianOptions,
    ISecretProvider secretProvider,
    IIntegrationSecretWriter secretWriter,
    IItsmConnectorOAuthTokenExchanger tokenExchanger,
    ITenantItsmConnectorConnectionRepository connectionRepository,
    IMemoryCache cache,
    ILogger<ItsmAtlassianOAuthConsentService> logger) : IItsmAtlassianOAuthConsentService
{
    private static readonly Uri AtlassianAuthorizeEndpoint = new("https://auth.atlassian.com/authorize");
    private static readonly TimeSpan PendingStateTtl = TimeSpan.FromMinutes(15);
    private const string CacheKeyPrefix = "itsm-atlassian-oauth:";

    private readonly IntegrationsAtlassianOAuthOptions _atlassianOptions =
        atlassianOptions?.Value ?? throw new ArgumentNullException(nameof(atlassianOptions));

    private readonly ISecretProvider _secretProvider =
        secretProvider ?? throw new ArgumentNullException(nameof(secretProvider));

    private readonly IIntegrationSecretWriter _secretWriter =
        secretWriter ?? throw new ArgumentNullException(nameof(secretWriter));

    private readonly IItsmConnectorOAuthTokenExchanger _tokenExchanger =
        tokenExchanger ?? throw new ArgumentNullException(nameof(tokenExchanger));

    private readonly ITenantItsmConnectorConnectionRepository _connectionRepository =
        connectionRepository ?? throw new ArgumentNullException(nameof(connectionRepository));

    private readonly IMemoryCache _cache = cache ?? throw new ArgumentNullException(nameof(cache));
    private readonly ILogger<ItsmAtlassianOAuthConsentService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<(ItsmAtlassianOAuthConsentStartResponse? Response, string? ErrorMessage)> TryStartAsync(
        Guid tenantId,
        ItsmAtlassianOAuthConsentStartRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!TenantItsmConnectorConnectionUpsertValidation.TryBuildUpsertCommand(
                request.InstanceBaseUrl,
                TenantItsmConnectorConnectionUpsertValidation.ToAuthModeLabel(ItsmConnectorAuthMode.OAuth2RefreshToken),
                authUserName: null,
                credentialKeyVaultSecretName: null,
                request.OAuthClientIdKeyVaultSecretName,
                request.OAuthClientSecretKeyVaultSecretName,
                request.OAuthRefreshTokenKeyVaultSecretName,
                request.InboundWebhookKeyVaultSecretName,
                isEnabled: true,
                request.Label,
                out TenantItsmConnectorConnectionUpsertCommand? command,
                out string? validationError))
        {
            return (null, validationError);
        }

        (string? clientId, string? clientSecret, string? resolveError) =
            await ResolveAtlassianClientCredentialsAsync(cancellationToken).ConfigureAwait(false);

        if (resolveError is not null)
            return (null, resolveError);

        string redirectUri = ResolveRedirectUri(request.RedirectUri);

        if (string.IsNullOrWhiteSpace(redirectUri))
            return (null, "RedirectUri is required when Integrations:AtlassianOAuth:DefaultRedirectUri is not set.");

        (string codeVerifier, string codeChallenge) = ItsmAtlassianOAuthPkce.CreatePair();
        string state = ItsmAtlassianOAuthPkce.CreateOpaqueState();
        DateTimeOffset expiresAt = TimeProvider.System.GetUtcNow().Add(PendingStateTtl);

        ItsmAtlassianOAuthConsentPendingState pending = new()
        {
            TenantId = tenantId,
            CodeVerifier = codeVerifier,
            RedirectUri = redirectUri,
            InstanceBaseUrl = command!.InstanceBaseUrl,
            OAuthClientIdKeyVaultSecretName = command.OAuthClientIdKeyVaultSecretName!,
            OAuthClientSecretKeyVaultSecretName = command.OAuthClientSecretKeyVaultSecretName!,
            OAuthRefreshTokenKeyVaultSecretName = command.OAuthRefreshTokenKeyVaultSecretName!,
            InboundWebhookKeyVaultSecretName = command.InboundWebhookKeyVaultSecretName,
            Label = command.Label,
            ExpiresAtUtc = expiresAt
        };

        _cache.Set(CacheKeyPrefix + state, pending, expiresAt);

        string scopes = string.IsNullOrWhiteSpace(_atlassianOptions.Scopes)
            ? "read:jira-work write:jira-work offline_access"
            : _atlassianOptions.Scopes.Trim();

        UriBuilder builder = new(AtlassianAuthorizeEndpoint)
        {
            Query = BuildAuthorizeQuery(clientId!, scopes, redirectUri, state, codeChallenge)
        };

        return (
            new ItsmAtlassianOAuthConsentStartResponse
            {
                AuthorizeUrl = builder.Uri.ToString(),
                State = state
            },
            null);
    }

    public async Task<(ItsmAtlassianOAuthConsentCompleteResponse? Response, string? ErrorMessage)> TryCompleteAsync(
        Guid tenantId,
        ItsmAtlassianOAuthConsentCompleteRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.Code))
            return (null, "Authorization code is required.");

        if (string.IsNullOrWhiteSpace(request.State))
            return (null, "State is required.");

        string cacheKey = CacheKeyPrefix + request.State.Trim();

        if (!_cache.TryGetValue(cacheKey, out ItsmAtlassianOAuthConsentPendingState? pending) || pending is null)
            return (null, "This consent attempt expired or was started in another session. Start Connect Jira again.");

        _cache.Remove(cacheKey);

        if (pending.TenantId != tenantId)
            return (null, "Consent state does not match the current tenant.");

        if (pending.ExpiresAtUtc <= TimeProvider.System.GetUtcNow())
            return (null, "This consent attempt expired. Start Connect Jira again.");

        (string? clientId, string? clientSecret, string? resolveError) =
            await ResolveAtlassianClientCredentialsAsync(cancellationToken).ConfigureAwait(false);

        if (resolveError is not null)
            return (null, resolveError);

        ItsmConnectorOAuthTokenExchangeResult? exchanged = await _tokenExchanger.TryExchangeAuthorizationCodeAsync(
            clientId!,
            clientSecret!,
            request.Code,
            pending.RedirectUri,
            pending.CodeVerifier,
            cancellationToken).ConfigureAwait(false);

        if (exchanged is null || string.IsNullOrWhiteSpace(exchanged.RefreshToken))
            return (null, "Atlassian did not return a refresh token. Verify offline_access scope and app registration.");

        bool stored = await _secretWriter.TryUpsertSecretAsync(
            pending.OAuthRefreshTokenKeyVaultSecretName,
            exchanged.RefreshToken,
            cancellationToken).ConfigureAwait(false);

        if (!stored)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    "Atlassian OAuth refresh token could not be persisted for tenant {TenantId}.",
                    tenantId);
            }

            return (null, "Refresh token could not be stored in secret storage. Verify Key Vault write access.");
        }

        TenantItsmConnectorConnectionUpsertCommand command = new()
        {
            InstanceBaseUrl = pending.InstanceBaseUrl,
            AuthMode = ItsmConnectorAuthMode.OAuth2RefreshToken,
            AuthUserName = string.Empty,
            CredentialKeyVaultSecretName = string.Empty,
            OAuthClientIdKeyVaultSecretName = pending.OAuthClientIdKeyVaultSecretName,
            OAuthClientSecretKeyVaultSecretName = pending.OAuthClientSecretKeyVaultSecretName,
            OAuthRefreshTokenKeyVaultSecretName = pending.OAuthRefreshTokenKeyVaultSecretName,
            InboundWebhookKeyVaultSecretName = pending.InboundWebhookKeyVaultSecretName,
            IsEnabled = true,
            Label = pending.Label
        };

        TenantItsmConnectorConnectionRecord? saved = await _connectionRepository.UpsertAsync(
            tenantId,
            TenantItsmConnectorProvider.Jira,
            command,
            cancellationToken).ConfigureAwait(false);

        if (saved is null)
            return (null, "Jira connector connection could not be persisted after OAuth consent.");

        return (
            new ItsmAtlassianOAuthConsentCompleteResponse
            {
                RefreshTokenStored = true,
                Connection = TenantItsmConnectorConnectionMapper.ToResponse(saved)
            },
            null);
    }

    private async Task<(string? ClientId, string? ClientSecret, string? ErrorMessage)> ResolveAtlassianClientCredentialsAsync(
        CancellationToken cancellationToken)
    {
        string? clientId = _atlassianOptions.OAuthClientId?.Trim();
        string? clientSecret = _atlassianOptions.OAuthClientSecret?.Trim();

        if (string.IsNullOrWhiteSpace(clientId)
            && !string.IsNullOrWhiteSpace(_atlassianOptions.OAuthClientIdKeyVaultSecretName))
        {
            clientId = await _secretProvider
                .GetSecretAsync(_atlassianOptions.OAuthClientIdKeyVaultSecretName.Trim(), cancellationToken)
                .ConfigureAwait(false);
        }

        if (string.IsNullOrWhiteSpace(clientSecret)
            && !string.IsNullOrWhiteSpace(_atlassianOptions.OAuthClientSecretKeyVaultSecretName))
        {
            clientSecret = await _secretProvider
                .GetSecretAsync(_atlassianOptions.OAuthClientSecretKeyVaultSecretName.Trim(), cancellationToken)
                .ConfigureAwait(false);
        }

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return (
                null,
                null,
                "Integrations:AtlassianOAuth client credentials are not configured for the ArchLucid Atlassian app.");
        }

        return (clientId, clientSecret, null);
    }

    private string ResolveRedirectUri(string? requestRedirectUri)
    {
        if (!string.IsNullOrWhiteSpace(requestRedirectUri))
            return requestRedirectUri.Trim();

        return _atlassianOptions.DefaultRedirectUri?.Trim() ?? string.Empty;
    }

    private static string BuildAuthorizeQuery(
        string clientId,
        string scopes,
        string redirectUri,
        string state,
        string codeChallenge) =>
        string.Join(
            "&",
            new[]
            {
                "audience=api.atlassian.com",
                "response_type=code",
                "prompt=consent",
                "code_challenge_method=S256",
                $"client_id={Uri.EscapeDataString(clientId)}",
                $"scope={Uri.EscapeDataString(scopes)}",
                $"redirect_uri={Uri.EscapeDataString(redirectUri)}",
                $"state={Uri.EscapeDataString(state)}",
                $"code_challenge={Uri.EscapeDataString(codeChallenge)}"
            });
}
