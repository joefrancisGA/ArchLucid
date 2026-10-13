using System.Collections.ObjectModel;

using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

/// <summary>Indexes the rows and existing nodes shared by the final metadata hydration stage.</summary>
internal sealed record AzureInventorySnapshotGraphIndexes(
    IReadOnlyDictionary<Guid, List<AzureInventoryResourcePropertyReadModel>> PropertiesByResourceRowId,
    IReadOnlyDictionary<string, GraphNode> NodesByArmId)
{
    private readonly Dictionary<Guid, IReadOnlyDictionary<string, string>> _usablePropertiesByRowId = [];

    /// <summary>Builds a reusable view on demand; callers must first check that property rows exist.</summary>
    public IReadOnlyDictionary<string, string> GetUsableProperties(Guid resourceRowId)
    {
        if (_usablePropertiesByRowId.TryGetValue(resourceRowId, out IReadOnlyDictionary<string, string>? cached))
        {
            return cached;
        }

        IReadOnlyDictionary<string, string> properties = new ReadOnlyDictionary<string, string>(
            PropertiesByResourceRowId[resourceRowId]
                .Where(property => !property.IsRedacted && !string.IsNullOrWhiteSpace(property.PropertyValue))
                .ToDictionary(
                    property => property.PropertyKey,
                    property => property.PropertyValue!,
                    StringComparer.OrdinalIgnoreCase));

        _usablePropertiesByRowId.Add(resourceRowId, properties);
        return properties;
    }

    public static AzureInventorySnapshotGraphIndexes Create(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<GraphNode> nodes,
        AzureInventorySnapshotPropertyIndex? properties = null)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(nodes);

        return new(
            (properties ?? AzureInventorySnapshotPropertyIndex.Create(snapshot)).ByResourceRowId,
            nodes
                .Where(node => node.Properties.TryGetValue("arm.id", out string? armId) && !string.IsNullOrWhiteSpace(armId))
                .GroupBy(node => ArmResourceIdNormalizer.Normalize(node.Properties["arm.id"]), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(group => group.Key, group => group.First(), StringComparer.OrdinalIgnoreCase));
    }
}
