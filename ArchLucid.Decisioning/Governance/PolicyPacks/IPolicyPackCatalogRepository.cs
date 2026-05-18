namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>Platform policy-pack catalog snapshots (promoted rows visible to all authenticated tenants).</summary>
public interface IPolicyPackCatalogRepository
{
    /// <summary>Promoted catalog rows ordered by display name.</summary>
    Task<IReadOnlyList<PolicyPackCatalogListItem>> ListPromotedAsync(CancellationToken ct);

    /// <summary>Promoted catalog entry with snapshot JSON, or <c>null</c> when missing or not promoted.</summary>
    Task<PolicyPackCatalogEntryDetail?> GetPromotedDetailByIdAsync(Guid policyPackCatalogEntryId, CancellationToken ct);

    /// <summary>Sets <see cref="PolicyPackCatalogEntryRow.IsPromoted" /> to false for the entry id.</summary>
    /// <returns><c>true</c> when a row was updated.</returns>
    Task<bool> TryDemoteAsync(Guid policyPackCatalogEntryId, CancellationToken ct);

    /// <summary>
    ///     Inserts or updates the catalog row keyed by <paramref name="sourcePolicyPackId" />, snapshots content, and sets
    ///     promoted.
    /// </summary>
    Task<PolicyPackCatalogEntryDetail> UpsertPromotedFromSnapshotAsync(
        Guid sourcePolicyPackId,
        string displayName,
        string description,
        string packType,
        string snapshotVersion,
        string snapshotContentJson,
        CancellationToken ct);
}
