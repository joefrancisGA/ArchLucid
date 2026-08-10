using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>
///     RC28 package-coverage batch: Mermaid diagram rendering, diagram AST generation, and artifact hashing.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc28Tests
{
    [Fact]
    public void MermaidDiagramRenderer_Format_is_mermaid()
    {
        MermaidDiagramRenderer renderer = new();

        renderer.Format.Should().Be("mermaid");
    }

    [Fact]
    public void MermaidDiagramRenderer_Render_emits_nodes_and_edges_with_escaped_quotes()
    {
        MermaidDiagramRenderer renderer = new();
        DiagramAst ast = new()
        {
            Title = "Sample",
            Nodes =
            [
                new DiagramNode { NodeId = "a", Label = "Alpha \"one\"", NodeType = "Service" },
                new DiagramNode { NodeId = "b", Label = "Beta", NodeType = "Database" },
            ],
            Edges =
            [
                new DiagramEdge { FromNodeId = "a", ToNodeId = "b", Label = "writes \"data\"" },
            ],
        };

        string mermaid = renderer.Render(ast);

        mermaid.Should().StartWith("flowchart TD");
        mermaid.Should().Contain("a[\"Alpha 'one'\"]");
        mermaid.Should().Contain("b[\"Beta\"]");
        mermaid.Should().Contain("a -->|\"writes 'data'\"| b");
    }

    [Fact]
    public async Task DiagramAstGenerator_GenerateAsync_builds_decision_and_issue_graph()
    {
        DiagramAstGenerator generator = new();
        ManifestDocument manifest = NewManifest();

        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        generator.ArtifactType.Should().Be(ArtifactType.DiagramAst);
        artifact.Name.Should().Be("diagram-ast.json");
        artifact.Format.Should().Be("json");
        artifact.RunId.Should().Be(manifest.RunId);
        artifact.ManifestId.Should().Be(manifest.ManifestId);
        artifact.ContentHash.Should().Be(ArtifactHashing.ComputeHash(artifact.Content));

        DiagramAst? ast = JsonSerializer.Deserialize<DiagramAst>(artifact.Content);
        ast.Should().NotBeNull();
        ast!.Title.Should().Be("N");
        ast.Nodes.Should().Contain(n => n.NodeId == "manifest" && n.Label == "Golden Manifest");
        ast.Nodes.Should().Contain(n => n.NodeId == "decision-d1" && n.Label == "t");
        ast.Nodes.Should().Contain(n => n.NodeId == "issue-0" && n.Label == "open issue");
        ast.Edges.Should().Contain(e => e.FromNodeId == "manifest" && e.ToNodeId == "decision-d1" && e.Label == "contains");
        ast.Edges.Should().Contain(e => e.FromNodeId == "manifest" && e.ToNodeId == "issue-0" && e.Label == "flags");
    }

    [Fact]
    public void ArtifactHashing_ComputeHash_is_stable_for_same_content()
    {
        const string content = "{\"hello\":\"world\"}";

        string first = ArtifactHashing.ComputeHash(content);
        string second = ArtifactHashing.ComputeHash(content);

        first.Should().NotBeNullOrWhiteSpace();
        first.Should().Be(second);
        ArtifactHashing.ComputeHash("other").Should().NotBe(first);
    }

    private static ManifestDocument NewManifest()
    {
        Guid runId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid manifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

        return new ManifestDocument
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            ManifestId = manifestId,
            RunId = runId,
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            FindingsSnapshotId = Guid.NewGuid(),
            DecisionTraceId = Guid.NewGuid(),
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "h",
            RuleSetId = "rs",
            RuleSetVersion = "1",
            RuleSetHash = "rh",
            Metadata = new ManifestMetadata { Name = "N" },
            Requirements = new RequirementsCoverageSection(),
            Topology = new TopologySection(),
            Security = new SecuritySection(),
            Compliance = new ComplianceSection(),
            Cost = new CostSection(),
            Constraints = new ConstraintSection(),
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items =
                [
                    new ManifestIssue { Title = "open issue", Severity = "Medium" },
                ],
            },
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    DecisionId = "d1",
                    Category = "c",
                    Title = "t",
                    SelectedOption = "o",
                    Rationale = "r",
                },
            ],
        };
    }
}
