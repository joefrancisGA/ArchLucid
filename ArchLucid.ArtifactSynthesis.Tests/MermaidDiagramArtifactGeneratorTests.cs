using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class MermaidDiagramArtifactGeneratorTests
{
    [Fact]
    public async Task GenerateAsync_builds_ast_from_manifest_and_uses_renderer()
    {
        Mock<IDiagramRenderer> renderer = new();
        renderer.Setup(x => x.Format).Returns("mermaid");
        renderer.Setup(x => x.Render(It.IsAny<Models.DiagramAst>()))
            .Returns("rendered-mermaid");

        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new Core.Manifest.Sections.ManifestMetadata { Name = "Sys" },
            Decisions =
            [
                new ResolvedArchitectureDecision
                {
                    DecisionId = "dec-1",
                    Category = "Security",
                    Title = "Use TLS",
                    SelectedOption = "TLS1.3",
                    Rationale = "Strong crypto",
                },
            ],
        };

        MermaidDiagramArtifactGenerator sut = new(renderer.Object);

        SynthesizedArtifact artifact = await sut.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(Models.ArtifactType.MermaidDiagram);
        artifact.Content.Should().Be("rendered-mermaid");
        artifact.Metadata.Should().ContainKey("title").WhoseValue.Should().Be("Sys");
        renderer.Verify(
            x => x.Render(It.Is<Models.DiagramAst>(a => a.Nodes.Count >= 2)),
            Times.Once);
    }

    [Fact]
    public async Task GenerateAsync_includes_unresolved_issue_nodes_for_diagram_ast_parity()
    {
        Mock<IDiagramRenderer> renderer = new();
        renderer.Setup(x => x.Format).Returns("mermaid");
        renderer.Setup(x => x.Render(It.IsAny<Models.DiagramAst>()))
            .Returns("rendered-mermaid");

        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new Core.Manifest.Sections.ManifestMetadata { Name = "Sys" },
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items =
                [
                    new ManifestIssue { Title = "open issue", Severity = "Medium" },
                ],
            },
        };

        MermaidDiagramArtifactGenerator sut = new(renderer.Object);

        await sut.GenerateAsync(manifest, CancellationToken.None);

        renderer.Verify(
            x => x.Render(It.Is<Models.DiagramAst>(a =>
                a.Nodes.Any(n => n.NodeId == "issue_0" && n.Label == "open issue")
                && a.Edges.Any(e => e.FromNodeId == "manifest" && e.ToNodeId == "issue_0" && e.Label == "flags"))),
            Times.Once);
    }

    [Fact]
    public async Task GenerateAsync_builds_decision_graph_only_when_typed_topology_services_present()
    {
        Mock<IDiagramRenderer> renderer = new();
        renderer.Setup(x => x.Format).Returns("mermaid");
        renderer.Setup(x => x.Render(It.IsAny<Models.DiagramAst>()))
            .Returns("rendered-mermaid");

        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new Core.Manifest.Sections.ManifestMetadata { Name = "Sys" },
            Topology = new TopologySection
            {
                Services =
                [
                    new ManifestService
                    {
                        ServiceName = "checkout-api",
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
            },
        };

        MermaidDiagramArtifactGenerator sut = new(renderer.Object);

        await sut.GenerateAsync(manifest, CancellationToken.None);

        renderer.Verify(
            x => x.Render(It.Is<Models.DiagramAst>(a =>
                a.Nodes.Count == 1
                && a.Nodes[0].NodeId == "manifest"
                && a.Edges.Count == 0)),
            Times.Once);
    }
}
