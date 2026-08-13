using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Repositories;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

/// <summary>RC29e package-coverage batch: coverage summary generator, model bags, and repository eviction.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArtifactSynthesisPackageCoverageBatchRc29eTests
{
    [Fact]
    public async Task CoverageSummaryArtifactGenerator_maps_topology_gaps_and_counts()
    {
        ManifestDocument manifest = new()
        {
            RunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            ManifestId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Requirements = new RequirementsCoverageSection
            {
                Covered = [new RequirementCoverageItem { RequirementName = "R1" }],
                Uncovered = [new RequirementCoverageItem { RequirementName = "R2" }],
            },
            Security = new SecuritySection { Gaps = ["missing WAF"] },
            Compliance = new ComplianceSection { Gaps = ["SOC logging"] },
            UnresolvedIssues = new UnresolvedIssuesSection
            {
                Items = [new ManifestIssue { Title = "open issue", Severity = "Medium" }],
            },
            Topology = new TopologySection { Gaps = ["no DR region"] },
        };

        CoverageSummaryArtifactGenerator generator = new();
        SynthesizedArtifact artifact = await generator.GenerateAsync(manifest, CancellationToken.None);

        artifact.ArtifactType.Should().Be(ArtifactType.CoverageSummary);
        artifact.Name.Should().Be("coverage-summary.json");
        artifact.Content.Should().Contain("no DR region");
        artifact.Content.Should().Contain("CoveredRequirementCount");
    }

    [Fact]
    public void Inventory_and_diagram_model_bags_roundtrip_properties()
    {
        InventoryItem item = new()
        {
            Category = "Security",
            Name = "WAF",
            Status = "Implemented",
            Notes = "ingress",
        };

        InventoryArtifactModel inventory = new()
        {
            Items = [item],
        };

        DiagramNode node = new()
        {
            NodeId = "node-1",
            Label = "API",
            NodeType = "service",
        };

        DiagramEdge edge = new()
        {
            FromNodeId = "node-1",
            ToNodeId = "node-2",
            Label = "calls",
        };

        DiagramAst ast = new()
        {
            Nodes = [node],
            Edges = [edge],
        };

        inventory.Items[0].Name.Should().Be("WAF");
        ast.Nodes[0].Label.Should().Be("API");
        ast.Edges[0].Label.Should().Be("calls");
    }

    [Fact]
    public void Artifact_metadata_rows_and_page_records_expose_sort_order()
    {
        ArtifactMetadataRow row = new(
            1,
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            ArtifactType.Inventory,
            "inventory.json",
            "json",
            "hash-1",
            "blob://inventory");

        ArtifactBundleArtifactMetadataPage page = new([row], HasMore: false);

        row.SortOrder.Should().Be(1);
        row.Name.Should().Be("inventory.json");
        page.HasMore.Should().BeFalse();
        page.Items.Should().ContainSingle();
    }

    [Fact]
    public async Task InMemoryArtifactBundleRepository_evicts_oldest_entries_past_capacity()
    {
        InMemoryArtifactBundleRepository repository = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };

        Guid firstManifestId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        ArtifactBundle firstBundle = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            BundleId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ManifestId = firstManifestId,
            Artifacts = [
                new SynthesizedArtifact
                {
                    ArtifactType = "Test",
                    Content = "body",
                    ContentHash = "hash",
                },
            ],
        };

        await repository.SaveAsync(firstBundle, CancellationToken.None);

        for (int i = 0; i < 500; i++)
        {
            ArtifactBundle bundle = new()
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                BundleId = Guid.NewGuid(),
                ManifestId = Guid.NewGuid(),
                Artifacts = [
                    new SynthesizedArtifact
                    {
                        ArtifactType = "Test",
                        Content = "body",
                        ContentHash = "hash",
                    },
                ],
            };

            await repository.SaveAsync(bundle, CancellationToken.None);
        }

        ArtifactBundle? evicted = await repository.GetByManifestIdAsync(
            scope,
            firstManifestId,
            loadArtifactBodies: true,
            CancellationToken.None);

        evicted.Should().BeNull();
    }
}
