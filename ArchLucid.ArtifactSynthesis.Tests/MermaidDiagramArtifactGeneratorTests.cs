using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.Contracts.Common;
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

        Models.DiagramAst? captured = null;
        renderer
            .Setup(x => x.Render(It.IsAny<Models.DiagramAst>()))
            .Callback<Models.DiagramAst>(ast => captured = ast)
            .Returns("rendered-mermaid");

        ManifestDocument manifest = new()
        {
            RunId = Guid.NewGuid(),
            ManifestId = Guid.NewGuid(),
            Metadata = new ManifestMetadata { Name = "Sys" },
            Topology = new TopologySection
            {
                Services =
                [
                    new ArchLucid.Contracts.Manifest.ManifestService
                    {
                        ServiceId = "svc-orders",
                        ServiceName = "Orders API",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
                Datastores =
                [
                    new ArchLucid.Contracts.Manifest.ManifestDatastore
                    {
                        DatastoreId = "ds-orders",
                        DatastoreName = "Orders DB",
                        DatastoreType = DatastoreType.Sql,
                        RuntimePlatform = RuntimePlatform.SqlServer,
                    },
                ],
                Relationships =
                [
                    new ArchLucid.Contracts.Manifest.ManifestRelationship
                    {
                        RelationshipId = "rel-1",
                        SourceId = "svc-orders",
                        TargetId = "ds-orders",
                        RelationshipType = RelationshipType.ReadsFrom,
                    },
                ],
            },
        };

        MermaidDiagramArtifactGenerator sut = new(renderer.Object);

        await sut.GenerateAsync(manifest, CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.Nodes.Should().Contain(n => n.NodeId == "service_svc-orders" && n.Label == "Orders API");
        captured.Nodes.Should().Contain(n => n.NodeId == "datastore_ds-orders" && n.Label == "Orders DB");
        captured.Edges.Should().Contain(e =>
            e.FromNodeId == "service_svc-orders"
            && e.ToNodeId == "datastore_ds-orders"
            && e.Label == "ReadsFrom");
    }
}
