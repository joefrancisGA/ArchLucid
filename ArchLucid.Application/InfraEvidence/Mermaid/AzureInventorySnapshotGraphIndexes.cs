using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Indexes the rows and existing nodes shared by the final metadata hydration stage.</summary>
internal sealed record AzureInventorySnapshotGraphIndexes(
    IReadOnlyDictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> PropertiesByResourceRowId,
    IReadOnlyDictionary<string, GraphNode> NodesByArmId)
{
    public static AzureInventorySnapshotGraphIndexes Create(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<GraphNode> nodes)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodes);

        return new(
            snapshot.Properties
                .GroupBy(property => property.ResourceRowId)
                .ToDictionary(group => group.Key, group => group.ToList()),
            nodes
                .Where(node => node.Properties.TryGetValue("arm.id", out string? armId) && !string.IsNullOrWhiteSpace(armId))
                .GroupBy(node => ArmResourceIdNormalizer.Normalize(node.Properties["arm.id"]), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase));
    }
}
