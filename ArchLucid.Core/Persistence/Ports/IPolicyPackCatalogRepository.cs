using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Platform policy-pack catalog snapshots (promoted rows visible to all authenticated tenants).</summary>
public interface IPolicyPackCatalogRepository
{
    Task<IReadOnlyList<PolicyPackCatalogListItem>> ListPromotedAsync(CancellationToken ct);

    Task<PolicyPackCatalogEntryDetail?> GetPromotedDetailByIdAsync(Guid policyPackCatalogEntryId, CancellationToken ct);

    Task<bool> TryDemoteAsync(Guid policyPackCatalogEntryId, CancellationToken ct);

    Task<PolicyPackCatalogEntryDetail> UpsertPromotedFromSnapshotAsync(
        Guid sourcePolicyPackId,
        string displayName,
        string description,
        string packType,
        string snapshotVersion,
        string snapshotContentJson,
        CancellationToken ct);
}
