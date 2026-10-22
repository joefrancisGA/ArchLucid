using System.Collections.Concurrent;

namespace ArchLucid.Persistence.Integrations;

/// <summary>In-memory ITSM correlation store for <c>StorageProvider=InMemory</c> (no <c>FindingRecords</c> updates).</summary>
public sealed partial class InMemoryItsmFindingCorrelationRepository : IItsmFindingCorrelationRepository
{
    private readonly ConcurrentDictionary<string, ItsmFindingCorrelationRecord> _byKey = new();

    private static string Key(Guid tenantId, string provider, string externalKey) =>
        $"{tenantId:D}\u001f{provider.Trim()}\u001f{externalKey.Trim()}";

    private List<ItsmFindingCorrelationRecord> MatchByProviderAndExternalKey(string provider, string externalKey)
    {
        string trimmedProvider = provider.Trim();
        string trimmedExternalKey = externalKey.Trim();

        return _byKey.Values
            .Where(r =>
                string.Equals(r.Provider, trimmedProvider, StringComparison.Ordinal) &&
                string.Equals(r.ExternalKey, trimmedExternalKey, StringComparison.Ordinal))
            .ToList();
    }
}
