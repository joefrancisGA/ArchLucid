using System.Text.Json;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.Tests.InfraEvidence.GraphEquivalence;

internal static class AzureGraphSemanticCapture
{
    public static JsonElement Capture(GraphSnapshot graph)
    {
        Dictionary<string, string> identities = graph.Nodes.ToDictionary(node => node.NodeId, Identity, StringComparer.Ordinal);
        DiagramAst diagram = new DiagramAstFromGraphCompiler().Compile(graph, DiagramMode.FullSubscription);
        Dictionary<string, DiagramSubgraph> groups = diagram.Subgraphs.ToDictionary(group => group.SubgraphId, StringComparer.Ordinal);
        string GroupIdentity(string? id) => string.IsNullOrWhiteSpace(id) ? string.Empty
            : GroupIdentity(groups[id].ParentSubgraphId) + "/" + groups[id].Label;
        Dictionary<string, string> diagramIds = diagram.Nodes.ToDictionary(node => node.NodeId,
            node => string.IsNullOrWhiteSpace(node.ArmResourceId) ? "label:" + node.Label : ArmResourceIdNormalizer.Normalize(node.ArmResourceId), StringComparer.Ordinal);
        return JsonSerializer.SerializeToElement(new
        {
            nodes = graph.Nodes.OrderBy(Identity, StringComparer.Ordinal).Select(node => new
            {
                identity = Identity(node), node.NodeType, node.Label, node.Category, node.SourceType,
                properties = new SortedDictionary<string, string>(node.Properties, StringComparer.Ordinal),
            }),
            edges = graph.Edges.Select(edge => new
            {
                from = identities[edge.FromNodeId], to = identities[edge.ToNodeId], edge.EdgeType,
                edge.Label, edge.ProvenanceKind, edge.InferenceSource, edge.Weight, edge.DeclaredConnectionId,
                properties = new SortedDictionary<string, string>(edge.Properties, StringComparer.Ordinal),
            }).OrderBy(edge => JsonSerializer.Serialize(edge), StringComparer.Ordinal),
            diagramGroups = diagram.Subgraphs.Select(group => new
            {
                identity = GroupIdentity(group.SubgraphId), parent = GroupIdentity(group.ParentSubgraphId), group.Label,
            }).OrderBy(group => JsonSerializer.Serialize(group), StringComparer.Ordinal),
            diagramNodes = diagram.Nodes.Select(node => new
            {
                identity = diagramIds[node.NodeId], group = GroupIdentity(node.SubgraphId), node.Label, node.NodeType, node.ArmResourceType,
                node.HasPrivateEndpointAccess, state = node.ConnectionState?.ToString(), node.ConnectionStateMessage,
            }).OrderBy(node => JsonSerializer.Serialize(node), StringComparer.Ordinal),
            diagramEdges = diagram.Edges.Where(edge => !edge.IsLayoutOnly).Select(edge => new
            {
                from = diagramIds[edge.FromNodeId], to = diagramIds[edge.ToNodeId], edge.Label,
                edge.ProvenanceKind, edge.InferenceSource, edge.DeclaredConnectionId, edge.IsDataFlowNsgBlocked,
            }).OrderBy(edge => JsonSerializer.Serialize(edge), StringComparer.Ordinal),
        });
    }

    private static string Identity(GraphNode node) => string.IsNullOrWhiteSpace(node.SourceId)
        ? "label:" + node.Label : ArmResourceIdNormalizer.Normalize(node.SourceId);
}
