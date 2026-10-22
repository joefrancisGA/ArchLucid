using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Maps an operator-supplied neighborhood seed (graph node id, cloud resource GUID, ARM id,
///     mermaid node hash, or unique resource label) onto a topology <see cref="GraphNode.NodeId" />.
/// </summary>
public static class DiagramNeighborhoodSeedResolver
{
    private static readonly string[] AliasPropertyKeys =
    [
        "cloudResourceId",
        "azureResourceId",
        "armResourceId",
        "arm.id",
    ];

    public static string? TryResolveGraphNodeId(IReadOnlyList<GraphNode> nodes, string? seedToken)
    {
        ArgumentNullException.ThrowIfNull(nodes);

        if (string.IsNullOrWhiteSpace(seedToken))
        {
            return null;
        }

        string trimmed = seedToken.Trim();
        List<GraphNode> topology = nodes
            .Where(static node => node != null && !string.IsNullOrWhiteSpace(node.NodeId))
            .ToList();

        GraphNode? ordinalMatch = topology.Find(node =>
            string.Equals(node.NodeId, trimmed, StringComparison.Ordinal));

        if (ordinalMatch != null)
        {
            return ordinalMatch.NodeId;
        }

        GraphNode? ignoreCaseMatch = topology.Find(node =>
            string.Equals(node.NodeId, trimmed, StringComparison.OrdinalIgnoreCase));

        if (ignoreCaseMatch != null)
        {
            return ignoreCaseMatch.NodeId;
        }

        List<GraphNode> aliasMatches = topology
            .Where(node => CollectAliases(node).Any(alias =>
                string.Equals(alias, trimmed, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        if (aliasMatches.Count == 1)
        {
            return aliasMatches[0].NodeId;
        }

        List<GraphNode> labelMatches = topology
            .Where(node =>
                !string.IsNullOrWhiteSpace(node.Label)
                && string.Equals(node.Label, trimmed, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (labelMatches.Count == 1)
        {
            return labelMatches[0].NodeId;
        }

        return null;
    }

    private static IEnumerable<string> CollectAliases(GraphNode node)
    {
        yield return MermaidIdSanitizer.Sanitize(node.NodeId);

        string armId = DiagramAstGraphNodeClassifier.ReadArmId(node);

        if (!string.IsNullOrWhiteSpace(armId))
        {
            yield return armId;
        }

        if (!string.IsNullOrWhiteSpace(node.SourceId))
        {
            yield return node.SourceId;
        }

        if (node.Properties == null)
        {
            yield break;
        }

        foreach (string key in AliasPropertyKeys)
        {
            if (node.Properties.TryGetValue(key, out string? value) && !string.IsNullOrWhiteSpace(value))
            {
                yield return value;
            }
        }
    }
}
