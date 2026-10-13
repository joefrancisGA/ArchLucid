using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>First matching resource rows for one snapshot; does not filter or rewrite evidence.</summary>
internal sealed record AzureInventorySnapshotResourceIndex(
    IReadOnlyDictionary<Guid, AzureInventoryResourceRecord> ByResourceRowId,
    IReadOnlyDictionary<string, AzureInventoryResourceRecord> ByArmId)
{
    public static AzureInventorySnapshotResourceIndex Create(AzureInventorySnapshotDetailReadModel snapshot)
    {
        ArgumentNullException.ThrowIfNull(snapshot);

        Dictionary<Guid, AzureInventoryResourceRecord> byRowId = [];
        Dictionary<string, AzureInventoryResourceRecord> byArmId = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            byRowId.TryAdd(resource.ResourceRowId, resource);
            if (!string.IsNullOrWhiteSpace(resource.AzureResourceId))
            {
                byArmId.TryAdd(ArmResourceIdNormalizer.Normalize(resource.AzureResourceId), resource);
            }
        }

        return new AzureInventorySnapshotResourceIndex(byRowId, byArmId);
    }
}
