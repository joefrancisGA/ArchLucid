using System.Collections.Concurrent;


namespace ArchLucid.Persistence.Governance;

/// <summary>In-memory substitute for <see cref="DapperPolicyPackCatalogRepository" /> when SQL is disabled.</summary>
public sealed class InMemoryPolicyPackCatalogRepository : IPolicyPackCatalogRepository
{
    private readonly ConcurrentDictionary<Guid, InMemoryPolicyPackCatalogEntryState> _byCatalogId = new();
    private readonly ConcurrentDictionary<Guid, Guid> _sourceToCatalogId = new();

    /// <inheritdoc />
    public Task<IReadOnlyList<PolicyPackCatalogListItem>> ListPromotedAsync(CancellationToken ct)
    {
        _ = ct;

        List<PolicyPackCatalogListItem> rows = _byCatalogId.Values
            .Where(e => e.IsPromoted)
            .OrderBy(e => e.DisplayName, StringComparer.OrdinalIgnoreCase)
            .Select(ToListItem)
            .ToList();

        return Task.FromResult<IReadOnlyList<PolicyPackCatalogListItem>>(rows);
    }

    /// <inheritdoc />
    public Task<PolicyPackCatalogEntryDetail?> GetPromotedDetailByIdAsync(
        Guid policyPackCatalogEntryId,
        CancellationToken ct)
    {
        _ = ct;

        if (!_byCatalogId.TryGetValue(policyPackCatalogEntryId, out InMemoryPolicyPackCatalogEntryState? e) ||
            !e.IsPromoted)
            return Task.FromResult<PolicyPackCatalogEntryDetail?>(null);

        return Task.FromResult<PolicyPackCatalogEntryDetail?>(ToDetail(e));
    }

    /// <inheritdoc />
    public Task<bool> TryDemoteAsync(Guid policyPackCatalogEntryId, CancellationToken ct)
    {
        _ = ct;

        if (!_byCatalogId.TryGetValue(policyPackCatalogEntryId, out InMemoryPolicyPackCatalogEntryState? e))
            return Task.FromResult(false);

        e.IsPromoted = false;
        e.DemotedUtc = TimeProvider.System.GetUtcNow().UtcDateTime;
        return Task.FromResult(true);
    }

    /// <inheritdoc />
    public Task<PolicyPackCatalogEntryDetail> UpsertPromotedFromSnapshotAsync(
        Guid sourcePolicyPackId,
        string displayName,
        string description,
        string packType,
        string snapshotVersion,
        string snapshotContentJson,
        CancellationToken ct)
    {
        _ = ct;

        ArgumentException.ThrowIfNullOrWhiteSpace(displayName);
        ArgumentNullException.ThrowIfNull(description);
        ArgumentException.ThrowIfNullOrWhiteSpace(packType);
        ArgumentException.ThrowIfNullOrWhiteSpace(snapshotVersion);
        ArgumentException.ThrowIfNullOrWhiteSpace(snapshotContentJson);

        DateTime utcNow = TimeProvider.System.GetUtcNow().UtcDateTime;

        if (_sourceToCatalogId.TryGetValue(sourcePolicyPackId, out Guid catalogId))
        {
            InMemoryPolicyPackCatalogEntryState existing = _byCatalogId[catalogId];
            existing.DisplayName = displayName;
            existing.Description = description;
            existing.PackType = packType;
            existing.SnapshotVersion = snapshotVersion;
            existing.SnapshotContentJson = snapshotContentJson;
            existing.IsPromoted = true;
            existing.UpdatedUtc = utcNow;
            existing.PromotedUtc = utcNow;
            existing.DemotedUtc = null;

            return Task.FromResult(ToDetail(existing));
        }

        Guid newId = Guid.NewGuid();
        InMemoryPolicyPackCatalogEntryState created = new InMemoryPolicyPackCatalogEntryState
        {
            PolicyPackCatalogEntryId = newId,
            DisplayName = displayName,
            Description = description,
            PackType = packType,
            SnapshotVersion = snapshotVersion,
            SnapshotContentJson = snapshotContentJson,
            SourcePolicyPackId = sourcePolicyPackId,
            IsPromoted = true,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
            PromotedUtc = utcNow,
            DemotedUtc = null
        };

        _byCatalogId[newId] = created;
        _sourceToCatalogId[sourcePolicyPackId] = newId;

        return Task.FromResult(ToDetail(created));
    }

    private static PolicyPackCatalogListItem ToListItem(InMemoryPolicyPackCatalogEntryState e) =>
        new()
        {
            PolicyPackCatalogEntryId = e.PolicyPackCatalogEntryId,
            DisplayName = e.DisplayName,
            Description = e.Description,
            PackType = e.PackType,
            SnapshotVersion = e.SnapshotVersion,
            SourcePolicyPackId = e.SourcePolicyPackId,
            PromotedUtc = e.PromotedUtc
        };

    private static PolicyPackCatalogEntryDetail ToDetail(InMemoryPolicyPackCatalogEntryState e) =>
        new()
        {
            PolicyPackCatalogEntryId = e.PolicyPackCatalogEntryId,
            DisplayName = e.DisplayName,
            Description = e.Description,
            PackType = e.PackType,
            SnapshotVersion = e.SnapshotVersion,
            SourcePolicyPackId = e.SourcePolicyPackId,
            PromotedUtc = e.PromotedUtc,
            SnapshotContentJson = e.SnapshotContentJson
        };
}
