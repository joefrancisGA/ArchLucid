using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Decisioning.Models;

using ManifestMetadata = ArchLucid.Core.Manifest.Sections.ManifestMetadata;

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
            Metadata = new ManifestMetadata { Name = "Sys" },
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
    public async Task GenerateAsync_includes_typed_topology_services_datastores_and_relationships()
    {
        Mock<IDiagramRenderer> renderer = new();
        renderer.Setup(x => x.Format).Returns("mermaid");
        renderer.Setup(x => x.Render(It.IsAny<Models.DiagramAst>()))
            .Returns("rendered-mermaid");

        const string serviceId = "svc001";
        const string datastoreId = "ds001";

        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Name = "Sys" },
            Topology = new TopologySection
            {
                Services =
                [
                    new ManifestService
                    {
                        ServiceId = serviceId,
                        ServiceName = "Orders API",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                Datastores =
                [
                    new ManifestDatastore
                    {
                        DatastoreId = datastoreId,
                        DatastoreName = "Orders SQL",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                    },
                ],
                Relationships =
                [
                    new ManifestRelationship
                    {
                        SourceId = serviceId,
                        TargetId = datastoreId,
                        RelationshipType = RelationshipType.ReadsFrom,
                    },
                ],
            },
        };

        MermaidDiagramArtifactGenerator sut = new(renderer.Object);

        await sut.GenerateAsync(manifest, CancellationToken.None);

        renderer.Verify(
            x => x.Render(It.Is<Models.DiagramAst>(ast =>
                ast.Nodes.Any(n => n.NodeId == $"service_{serviceId}" && n.Label == "Orders API")
                && ast.Nodes.Any(n => n.NodeId == $"datastore_{datastoreId}" && n.Label == "Orders SQL")
                && ast.Edges.Any(e =>
                    e.FromNodeId == $"service_{serviceId}"
                    && e.ToNodeId == $"datastore_{datastoreId}"
                    && e.Label == RelationshipType.ReadsFrom.ToString()))),
            Times.Once);
    }
}
