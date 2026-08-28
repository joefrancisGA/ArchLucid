using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Generators;

public class MermaidDiagramArtifactGenerator(IDiagramRenderer renderer) : IArtifactGenerator
{
    public string ArtifactType => Models.ArtifactType.MermaidDiagram;

    public Task<SynthesizedArtifact> GenerateAsync(
        ManifestDocument manifest,
        CancellationToken ct)
    {
        _ = ct;
        DiagramAst ast = new() { Title = manifest.Metadata.Name };

        ast.Nodes.Add(new DiagramNode { NodeId = "manifest", Label = "Golden Manifest", NodeType = "Manifest" });

        foreach (ResolvedArchitectureDecision decision in manifest.Decisions)
        {
            string nodeId = $"decision_{decision.DecisionId}";
            ast.Nodes.Add(new DiagramNode { NodeId = nodeId, Label = decision.Title, NodeType = decision.Category });

            ast.Edges.Add(new DiagramEdge { FromNodeId = "manifest", ToNodeId = nodeId, Label = "decision" });
        }

        Dictionary<string, string> topologyNodeIds = new(StringComparer.Ordinal);

        foreach (ManifestService service in manifest.Topology.Services)
        {
            string nodeId = $"service_{service.ServiceId}";
            topologyNodeIds[service.ServiceId] = nodeId;
            ast.Nodes.Add(new DiagramNode { NodeId = nodeId, Label = service.ServiceName, NodeType = "Service" });

            ast.Edges.Add(new DiagramEdge { FromNodeId = "manifest", ToNodeId = nodeId, Label = "service" });
        }

        foreach (ManifestDatastore datastore in manifest.Topology.Datastores)
        {
            string nodeId = $"datastore_{datastore.DatastoreId}";
            topologyNodeIds[datastore.DatastoreId] = nodeId;
            ast.Nodes.Add(new DiagramNode { NodeId = nodeId, Label = datastore.DatastoreName, NodeType = "Datastore" });

            ast.Edges.Add(new DiagramEdge { FromNodeId = "manifest", ToNodeId = nodeId, Label = "datastore" });
        }

        foreach (ManifestRelationship relationship in manifest.Topology.Relationships)
        {
            if (!topologyNodeIds.TryGetValue(relationship.SourceId, out string? fromNodeId))
                continue;

            if (!topologyNodeIds.TryGetValue(relationship.TargetId, out string? toNodeId))
                continue;

            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = fromNodeId,
                ToNodeId = toNodeId,
                Label = relationship.RelationshipType.ToString(),
            });
        }

        string content = renderer.Render(ast);

        return Task.FromResult(new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArtifactType = Models.ArtifactType.MermaidDiagram,
            Name = "architecture.mmd",
            Format = renderer.Format,
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content),
            Metadata = new Dictionary<string, string> { ["title"] = ast.Title }
        });
    }
}
