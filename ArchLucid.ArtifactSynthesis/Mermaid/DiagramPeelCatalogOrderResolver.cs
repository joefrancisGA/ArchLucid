using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.InfraEvidence.DiagramPeel;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Mermaid;

public static class DiagramPeelCatalogOrderResolver
{
    private const int ImplicitChildResourcePeelRank = 25;

    public static IReadOnlyList<string> ResolvePeelOrder(
        DiagramPeelCatalogSnapshot catalog,
        GraphSnapshot graph)
    {
        ArgumentNullException.ThrowIfNull(catalog);
        ArgumentNullException.ThrowIfNull(graph);

        HashSet<string> neverPeel = catalog.Entries
            .Where(entry => entry.IsEnabled && entry.PeelRank is null)
            .Select(entry => entry.ArmResourceType)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        HashSet<string> catalogTypes = catalog.Entries
            .Select(entry => entry.ArmResourceType)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<(int Rank, string ArmType)> ordered = catalog.Entries
            .Where(entry => entry.IsEnabled && entry.PeelRank.HasValue)
            .Select(entry => (entry.PeelRank!.Value, entry.ArmResourceType))
            .ToList();

        HashSet<string> typesPresentInGraph = graph.Nodes
            .Where(DiagramAstGraphNodeClassifier.IsTopologyResource)
            .Select(DiagramAstGraphNodeClassifier.ReadArmType)
            .Where(armType => !string.IsNullOrWhiteSpace(armType))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (string armType in typesPresentInGraph
                     .Where(IsImplicitChildArmResourceType)
                     .Where(armType => !catalogTypes.Contains(armType))
                     .Where(armType => !neverPeel.Contains(armType))
                     .OrderBy(armType => armType, StringComparer.Ordinal))
        {
            ordered.Add((ImplicitChildResourcePeelRank, armType));
        }

        return ordered
            .OrderBy(pair => pair.Rank)
            .ThenBy(pair => pair.ArmType, StringComparer.Ordinal)
            .Select(pair => pair.ArmType)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    /// <summary>ARM child resources (provider/type/child) not explicitly catalogued.</summary>
    public static bool IsImplicitChildArmResourceType(string armType)
    {
        if (string.IsNullOrWhiteSpace(armType))
        {
            return false;
        }

        return armType.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Length > 2;
    }
}
