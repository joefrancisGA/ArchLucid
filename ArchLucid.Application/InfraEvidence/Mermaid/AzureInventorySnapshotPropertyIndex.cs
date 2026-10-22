using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Retains the original property rows for one snapshot, including duplicates and redaction.</summary>
internal sealed record AzureInventorySnapshotPropertyIndex(
    IReadOnlyDictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> ByResourceRowId)
{
    public static AzureInventorySnapshotPropertyIndex Create(AzureInventorySnapshotDetailReadModel snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        return new(snapshot.Properties
            .GroupBy(property => property.ResourceRowId)
            .ToDictionary(group => group.Key, group => group.ToList()));
    }
}
