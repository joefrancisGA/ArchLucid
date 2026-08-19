using System.Collections.Concurrent;
using System.Globalization;

using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Application.Integrations.Itsm.OAuth;

/// <summary>In-memory OAuth access-token cache keyed by tenant connector identity (TB-600).</summary>
public sealed class ItsmConnectorOAuthAccessTokenCache
{
    private readonly ConcurrentDictionary<string, CachedToken> _tokens = new(StringComparer.Ordinal);

    public bool TryGet(string cacheKey, out string accessToken)
    {
        accessToken = "";

        if (!_tokens.TryGetValue(cacheKey, out CachedToken? cached))
            return false;

        if (cached.ExpiresAtUtc <= TimeProvider.System.GetUtcNow().AddMinutes(1))
        {
            _tokens.TryRemove(cacheKey, out _);

            return false;
        }

        accessToken = cached.AccessToken;

        return true;
    }

    public void Set(string cacheKey, string accessToken, DateTimeOffset expiresAtUtc) =>
        _tokens[cacheKey] = new CachedToken(accessToken, expiresAtUtc);

    public static string BuildCacheKey(
        Guid tenantId,
        TenantItsmConnectorProvider provider,
        ItsmConnectorAuthMode authMode) =>
        string.Create(
            CultureInfo.InvariantCulture,
            $"{tenantId:D}:{provider}:{authMode}");

    private sealed record CachedToken(string AccessToken, DateTimeOffset ExpiresAtUtc);
}
