using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Generators;

public class DiagramAstGenerator : IArtifactGenerator
{
    public string ArtifactType => Models.ArtifactType.DiagramAst;

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
            string nodeId = $"decision-{decision.DecisionId}";

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
            string nodeId = $"issue-{i}";
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

        string content = JsonSerializer.Serialize(ast, SynthesisJsonOptions.WriteIndented);

        return Task.FromResult(new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArtifactType = Models.ArtifactType.DiagramAst,
            Name = $"{SanitizeArtifactStem(reviewTitle)}-diagram-ast.json",
            Format = "json",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content)
        });
    }

    private static string SanitizeArtifactStem(string reviewTitle)
    {
        if (string.Equals(reviewTitle, MermaidManifestDiagramHonestyCopy.ReviewNameNotStored, StringComparison.Ordinal))
        {
            return "review-name-not-stored";
        }

        string trimmed = reviewTitle.Trim();
        Span<char> buffer = stackalloc char[trimmed.Length];
        int length = 0;

        foreach (char character in trimmed)
        {
            if (char.IsWhiteSpace(character) || character is '/' or '\\' or ':' or '*' or '?' or '"' or '<' or '>' or '|')
            {
                if (length > 0 && buffer[length - 1] != '-')
                {
                    buffer[length++] = '-';
                }

                continue;
            }

            buffer[length++] = char.ToLowerInvariant(character);
        }

        while (length > 0 && buffer[length - 1] == '-')
        {
            length--;
        }

        return length == 0 ? "manifest" : new string(buffer[..length]);
    }
}
