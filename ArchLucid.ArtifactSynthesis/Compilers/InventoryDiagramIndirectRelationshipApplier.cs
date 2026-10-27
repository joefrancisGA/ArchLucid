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
                AssignResolvedRelationship(existingEdge, formattedLabel, resolved.InferenceSource, resolved.EvidenceCurrency);
                continue;
            }

            string fallbackKey = BuildEdgeKey(resolved.FromDiagramNodeId, resolved.ToDiagramNodeId, null);

            if (existingEdges.TryGetValue(fallbackKey, out DiagramEdge? fallbackEdge))
            {
                AssignResolvedRelationship(fallbackEdge, formattedLabel, resolved.InferenceSource, resolved.EvidenceCurrency);
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

    private static void AssignResolvedRelationship(
        DiagramEdge edge,
        string formattedLabel,
        string inferenceSource,
        InventoryDiagramEvidenceCurrency? evidenceCurrency)
    {
        edge.Label = formattedLabel;
        edge.InferenceSource = inferenceSource;
        string resolvedProvenance = ResolveProvenanceKind(evidenceCurrency);

        // Keep an existing machine provenance kind. Stamping "Unclassified" makes
        // DisplayLabelApplier replace the relationship verb with "Provenance was not stored."
        if (string.IsNullOrWhiteSpace(edge.ProvenanceKind)
            || string.Equals(edge.ProvenanceKind, "Unclassified", StringComparison.OrdinalIgnoreCase))
        {
            edge.ProvenanceKind = resolvedProvenance;
        }
    }

    private static string ResolveProvenanceKind(InventoryDiagramEvidenceCurrency? evidenceCurrency)
    {
        // ProvenanceKind must stay a machine enum. DisplayLabelApplier treats unrecognized
        // strings as Unclassified and replaces the relationship verb with
        // "Provenance was not stored." Missing currency on ARM inventory is current state.
        return evidenceCurrency switch
        {
            null => ProvenanceKind.ObservedFact.ToString(),
            InventoryDiagramEvidenceCurrency.Derived => ProvenanceKind.DerivedFact.ToString(),
            InventoryDiagramEvidenceCurrency.Observed => ProvenanceKind.ObservedFact.ToString(),
            InventoryDiagramEvidenceCurrency.Configured => ProvenanceKind.DeterministicInference.ToString(),
            InventoryDiagramEvidenceCurrency.Current => ProvenanceKind.ObservedFact.ToString(),
            _ => ProvenanceKind.ObservedFact.ToString(),
        };
    }

    private static string BuildEdgeKey(string fromNodeId, string toNodeId, string? inferenceSource)
    {
        return $"{fromNodeId}|{toNodeId}|{inferenceSource ?? string.Empty}";
    }
}
