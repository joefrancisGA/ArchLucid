using System.Collections.Concurrent;

using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Persistence.Governance;

/// <summary>In-memory platform bundled policy pack registry for tests and InMemory storage.</summary>
public sealed class InMemoryPlatformBundledPolicyPackRegistryRepository : IPlatformBundledPolicyPackRegistryRepository
{
    private readonly ConcurrentDictionary<string, PlatformBundledPolicyPackRegistryEntry> _rows =
        new(StringComparer.OrdinalIgnoreCase);
    private readonly Lock _writeGate = new();

    public Task<IReadOnlyList<PlatformBundledPolicyPackRegistryEntry>> ListAllAsync(CancellationToken ct)
    {
        IReadOnlyList<PlatformBundledPolicyPackRegistryEntry> rows = _rows.Values
            .OrderBy(static row => row.DisplayName, StringComparer.Ordinal)
            .ToList();

        return Task.FromResult(rows);
    }

    public Task UpsertAsync(PlatformBundledPolicyPackRegistryEntry entry, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(entry);

        lock (_writeGate)
        {
            bool isGloballyActive = _rows.TryGetValue(
                entry.BundleContentFile, out PlatformBundledPolicyPackRegistryEntry? existing)
                ? existing.IsGloballyActive
                : entry.IsGloballyActive;

            _rows[entry.BundleContentFile] = new PlatformBundledPolicyPackRegistryEntry
            {
                BundleContentFile = entry.BundleContentFile,
                DisplayName = entry.DisplayName,
                IsGloballyActive = isGloballyActive,
                UpdatedUtc = entry.UpdatedUtc,
            };
        }

        return Task.CompletedTask;
    }

    public Task<bool> TrySetGloballyActiveAsync(string bundleContentFile, bool isGloballyActive, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(bundleContentFile))
            return Task.FromResult(false);

        string key = bundleContentFile.Trim();

        lock (_writeGate)
        {
            if (!_rows.TryGetValue(key, out PlatformBundledPolicyPackRegistryEntry? existing))
                return Task.FromResult(false);

            existing.IsGloballyActive = isGloballyActive;
            existing.UpdatedUtc = TimeProvider.System.UtcNowDateTime();
        }

        return Task.FromResult(true);
    }
}
