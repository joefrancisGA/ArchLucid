using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

internal static class DiagramPeelAlwaysDisposeResolver
{
    public static IReadOnlySet<string> Resolve(DiagramPeelCatalogSnapshot catalog, GraphSnapshot graph)
    {
        ArgumentNullException.ThrowIfNull(catalog);
        ArgumentNullException.ThrowIfNull(graph);

        HashSet<string> types = catalog.Entries
            .Where(entry => entry.IsEnabled && entry.AlwaysDispose)
            .Select(entry => entry.ArmResourceType)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (string catalogType in DiagramPeelAlwaysDisposeArmTypes.CatalogArmTypes)
        {
            types.Add(catalogType);
        }

        IEnumerable<string> graphTypes = graph.Nodes
            .Where(DiagramAstGraphNodeClassifier.IsTopologyResource)
            .Select(DiagramAstGraphNodeClassifier.ReadArmType)
            .Where(armType => !string.IsNullOrWhiteSpace(armType));

        foreach (string armType in graphTypes)
        {
            if (DiagramPeelAlwaysDisposeArmTypes.MatchesSuffix(armType))
            {
                types.Add(armType);
            }
        }

        return types;
    }
}
