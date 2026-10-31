using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Manifest.Sections;
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
        string reviewTitle = string.IsNullOrWhiteSpace(manifest.Metadata.Name)
            ? MermaidManifestDiagramHonestyCopy.ReviewNameNotStored
            : manifest.Metadata.Name.Trim();

        DiagramAst ast = new() { Title = reviewTitle };

        ast.Nodes.Add(new DiagramNode
        {
            NodeId = "manifest",
            Label = reviewTitle,
            NodeType = "Manifest",
        });

        foreach (ResolvedArchitectureDecision decision in manifest.Decisions)
        {
            string nodeId = $"decision_{decision.DecisionId}";

            ast.Nodes.Add(new DiagramNode
            {
                NodeId = nodeId,
                Label = ManifestGoldenDiagramAstHonesty.FormatDecisionLabel(decision),
                NodeType = ManifestGoldenDiagramAstHonesty.FormatDecisionNodeType(decision),
            });

            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = "manifest",
                ToNodeId = nodeId,
                Label = MermaidManifestDiagramHonestyCopy.DecisionEdgeLabel,
            });
        }

        for (int i = 0; i < manifest.UnresolvedIssues.Items.Count; i++)
        {
            ManifestIssue issue = manifest.UnresolvedIssues.Items[i];
            string nodeId = $"issue_{i}";
            string issueLabel = string.IsNullOrWhiteSpace(issue.Title)
                ? MermaidManifestDiagramHonestyCopy.IssueTitleNotStored
                : issue.Title.Trim();

            ast.Nodes.Add(new DiagramNode
            {
                NodeId = nodeId,
                Label = issueLabel,
                NodeType = ManifestGoldenDiagramAstHonesty.FormatIssueNodeType(issue),
            });

            ast.Edges.Add(new DiagramEdge
            {
                FromNodeId = "manifest",
                ToNodeId = nodeId,
                Label = MermaidManifestDiagramHonestyCopy.IssueEdgeLabel,
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
