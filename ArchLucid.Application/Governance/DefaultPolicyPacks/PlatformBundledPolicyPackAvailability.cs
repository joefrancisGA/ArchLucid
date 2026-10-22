using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <summary>Reads global activation flags from <c>dbo.PlatformBundledPolicyPackRegistry</c>.</summary>
public sealed class PlatformBundledPolicyPackAvailability(
    IPlatformBundledPolicyPackRegistryRepository registryRepository,
    IMemoryCache memoryCache) : IPlatformBundledPolicyPackAvailability
{
    private const string InactiveDisplayNamesCacheKey = "platform-bundled-policy-pack-inactive-display-names";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(1);

    private readonly IPlatformBundledPolicyPackRegistryRepository _registryRepository =
        registryRepository ?? throw new ArgumentNullException(nameof(registryRepository));

    private readonly IMemoryCache _memoryCache =
        memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    public async ValueTask<bool> IsGloballyActiveAsync(PolicyPack pack, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(pack);

        if (!string.Equals(pack.PackType, PolicyPackType.PlatformDefault, StringComparison.Ordinal)
            && !string.Equals(pack.PackType, PolicyPackType.BuiltIn, StringComparison.Ordinal))
            return true;

        HashSet<string> inactiveDisplayNames = await GetInactiveDisplayNamesAsync(ct);

        if (inactiveDisplayNames.Count == 0)
            return true;

        return !inactiveDisplayNames.Contains(pack.Name.Trim());
    }

    public void InvalidateCache() => _memoryCache.Remove(InactiveDisplayNamesCacheKey);

    private async Task<HashSet<string>> GetInactiveDisplayNamesAsync(CancellationToken ct)
    {
        if (_memoryCache.TryGetValue(InactiveDisplayNamesCacheKey, out HashSet<string>? cached) && cached is not null)
            return cached;

        IReadOnlyList<PlatformBundledPolicyPackRegistryEntry> rows = await _registryRepository.ListAllAsync(ct);

        HashSet<string> inactive = rows
            .Where(static row => !row.IsGloballyActive)
            .Select(static row => row.DisplayName.Trim())
            .ToHashSet(StringComparer.Ordinal);

        _memoryCache.Set(InactiveDisplayNamesCacheKey, inactive, CacheDuration);

        return inactive;
    }
}
