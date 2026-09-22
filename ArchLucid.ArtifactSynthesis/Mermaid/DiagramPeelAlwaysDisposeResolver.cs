using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph.Inventory;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

internal static class DiagramPeelAlwaysDisposeResolver
{
    public static IReadOnlySet<string> Resolve(
        DiagramPeelCatalogSnapshot catalog,
        GraphSnapshot graph,
        DiagramMode mode)
    {
        ArgumentNullException.ThrowIfNull(catalog);
        ArgumentNullException.ThrowIfNull(graph);

        HashSet<string> types = catalog.Entries
            .Where(entry => entry.IsEnabled && entry.AlwaysDispose)
            .Select(entry => entry.ArmResourceType)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (string catalogType in AzureInventoryNeverShowArmTypes.CatalogArmTypes)
        {
            if (ShouldRetainIdentityDiagramArmType(catalogType, mode))
            {
                continue;
            }

            types.Add(catalogType);
        }

        IEnumerable<string> graphTypes = graph.Nodes
            .Where(DiagramAstGraphNodeClassifier.IsTopologyResource)
            .Select(DiagramAstGraphNodeClassifier.ReadArmType)
            .Where(armType => !string.IsNullOrWhiteSpace(armType));

        foreach (string armType in graphTypes)
        {
            if (ShouldRetainIdentityDiagramArmType(armType, mode))
            {
                continue;
            }

            if (AzureInventoryNeverShowArmTypes.ShouldOmitFromInventory(armType))
            {
                types.Add(armType);
            }
        }

        return types;
    }

    private static bool ShouldRetainIdentityDiagramArmType(string armType, DiagramMode mode)
    {
        return mode == DiagramMode.Identity
            && AzureInventoryTopologyCategory.IsIdentityArmResourceType(armType);
    }
}
