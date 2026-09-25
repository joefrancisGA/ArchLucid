using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>
///     Projects cited indirect relationships as labeled diagram edges and removes collocation guesses (NR-04).
/// </summary>
internal static class InventoryDiagramIndirectRelationshipApplier
{
    public static void Apply(
        DiagramAst ast,
        GraphSnapshot graph,
        IReadOnlyDictionary<string, string> graphToDiagramNodeId)
    {
        ArgumentNullException.ThrowIfNull(ast);
        ArgumentNullException.ThrowIfNull(graph);
        ArgumentNullException.ThrowIfNull(graphToDiagramNodeId);

        if (ast.Nodes.Count == 0)
        {
            return;
        }

        HashSet<string> visibleDiagramNodeIds = ast.Nodes
            .Select(node => node.NodeId)
            .ToHashSet(StringComparer.Ordinal);

        ast.Edges.RemoveAll(edge =>
            !edge.IsLayoutOnly
            && string.Equals(
                edge.InferenceSource,
                GraphEdgeInferenceSources.InventoryResourceGroupCollocation,
                StringComparison.OrdinalIgnoreCase));

        IReadOnlyList<InventoryDiagramIndirectRelationshipResolvedEdge> resolvedEdges =
            InventoryDiagramIndirectRelationshipResolver.Resolve(graph, graphToDiagramNodeId, visibleDiagramNodeIds);

        Dictionary<string, DiagramEdge> existingEdges = ast.Edges
            .Where(edge => !edge.IsLayoutOnly)
            .GroupBy(edge => BuildEdgeKey(edge.FromNodeId, edge.ToNodeId, edge.InferenceSource), StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (InventoryDiagramIndirectRelationshipResolvedEdge resolved in resolvedEdges)
        {
            string formattedLabel = FormatResolvedLabel(resolved);
            string edgeKey = BuildEdgeKey(
                resolved.FromDiagramNodeId,
                resolved.ToDiagramNodeId,
                resolved.InferenceSource);

            if (existingEdges.TryGetValue(edgeKey, out DiagramEdge? existingEdge))
            {
                existingEdge.Label = formattedLabel;
                existingEdge.InferenceSource = resolved.InferenceSource;
                existingEdge.ProvenanceKind = ResolveProvenanceKind(resolved.EvidenceCurrency);
                continue;
            }

            string fallbackKey = BuildEdgeKey(resolved.FromDiagramNodeId, resolved.ToDiagramNodeId, null);

            if (existingEdges.TryGetValue(fallbackKey, out DiagramEdge? fallbackEdge))
            {
                fallbackEdge.Label = formattedLabel;
                fallbackEdge.InferenceSource = resolved.InferenceSource;
                fallbackEdge.ProvenanceKind = ResolveProvenanceKind(resolved.EvidenceCurrency);
                continue;
            }

            DiagramEdge newEdge = new()
            {
                FromNodeId = resolved.FromDiagramNodeId,
                ToNodeId = resolved.ToDiagramNodeId,
                Label = formattedLabel,
                InferenceSource = resolved.InferenceSource,
                ProvenanceKind = ResolveProvenanceKind(resolved.EvidenceCurrency),
            };

            ast.Edges.Add(newEdge);
            existingEdges[edgeKey] = newEdge;
        }
    }

    private static string FormatResolvedLabel(InventoryDiagramIndirectRelationshipResolvedEdge resolved)
    {
        if (resolved.DerivedHopLabels.Count == 0)
        {
            return InventoryDiagramEvidenceCurrencyLabels.Format(
                resolved.EvidenceCurrency,
                resolved.RelationshipLabel);
        }

        string hopSummary = string.Join(" → ", resolved.DerivedHopLabels);
        string relationshipLabel = $"{resolved.RelationshipLabel} ({hopSummary})";

        return InventoryDiagramEvidenceCurrencyLabels.Format(
            resolved.EvidenceCurrency,
            relationshipLabel);
    }

    private static string ResolveProvenanceKind(InventoryDiagramEvidenceCurrency evidenceCurrency)
    {
        return evidenceCurrency switch
        {
            InventoryDiagramEvidenceCurrency.Derived => ProvenanceKind.DerivedFact.ToString(),
            InventoryDiagramEvidenceCurrency.Observed => ProvenanceKind.ObservedFact.ToString(),
            InventoryDiagramEvidenceCurrency.Configured => ProvenanceKind.DeterministicInference.ToString(),
            _ => ProvenanceKind.ObservedFact.ToString(),
        };
    }

    private static string BuildEdgeKey(string fromNodeId, string toNodeId, string? inferenceSource)
    {
        return $"{fromNodeId}|{toNodeId}|{inferenceSource ?? string.Empty}";
    }
}
