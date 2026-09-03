using System.IO.Compression;
using System.Text;

using ArchLucid.Application;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OrphanedAzureResourceFindingEngineTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task AnalyzeAsync_returns_orphan_findings_from_resources_json()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Compute/disks",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk1",
                "properties": {}
              }
            ]
            """;

        (OrphanedAzureResourceFindingEngine sut, FindingAnalysisContext context) = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].FindingType.Should().Be("OrphanedAzureResource");
        findings[0].EngineType.Should().Be("orphaned-azure-resource");
        findings[0].Severity.Should().Be(FindingSeverity.Warning);
        findings[0].Payload.Should().BeOfType<RequirementFindingPayload>();
        findings[0].Title.Should().Contain("Microsoft.Compute/disks");
        findings[0].Trace.AlternativePathsConsidered.Should().HaveCount(3);
        findings[0].Trace.AlternativePathsConsidered.Should()
            .Contain(path => path.Contains("Attach the disk", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task AnalyzeAsync_links_related_topology_node_when_resource_id_matches_graph()
    {
        const string resourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk1";

        const string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Compute/disks",
                "resourceId": "{{resourceId}}",
                "properties": {}
              }
            ]
            """;

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "topology-disk-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "disk1",
                    Properties = new Dictionary<string, string> { ["resourceId"] = resourceId },
                },
            ],
        };

        (OrphanedAzureResourceFindingEngine sut, FindingAnalysisContext context) = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].RelatedNodeIds.Should().ContainSingle().Which.Should().Be("topology-disk-1");
    }

    [Theory]
    [InlineData("Microsoft.Network/networkInterfaces", "Attach the NIC")]
    [InlineData("Microsoft.Network/publicIPAddresses", "Associate the public IP")]
    public async Task AnalyzeAsync_populates_resource_specific_alternative_paths(string resourceType, string expectedPathFragment)
    {
        string resourceIdType = resourceType.Replace('/', '.');
        string resourcesJson =
            $$"""
            [
              {
                "resourceType": "{{resourceType}}",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/{{resourceIdType}}/res1",
                "properties": {}
              }
            ]
            """;

        (OrphanedAzureResourceFindingEngine sut, FindingAnalysisContext context) = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Trace.AlternativePathsConsidered.Should().HaveCount(3);
        findings[0].Trace.AlternativePathsConsidered.Should()
            .Contain(path => path.Contains(expectedPathFragment, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task AnalyzeAsync_prefers_orphan_candidates_json_when_present()
    {
        const string orphanCandidatesJson =
            """
            {
              "candidates": [
                {
                  "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk-from-extractor",
                  "resourceType": "Microsoft.Compute/disks",
                  "reason": "Extractor orphan candidate",
                  "annualSavingsUsd": 240
                }
              ]
            }
            """;

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Compute/disks",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk-from-resources",
                "properties": {}
              }
            ]
            """;

        (OrphanedAzureResourceFindingEngine sut, FindingAnalysisContext context) = CreateSut(
            CreatePackageWithOrphanCandidates(orphanCandidatesJson, resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Payload.Should().BeOfType<ExtractorOrphanCandidateFindingPayload>();
        findings[0].Trace.RulesApplied.Should().Contain("extractor-orphan-candidates-json");
        ((ExtractorOrphanCandidateFindingPayload)findings[0].Payload!).ResourceId.Should().Contain("disk-from-extractor");
    }

    [Fact]
    public async Task AnalyzeAsync_falls_back_to_resources_json_when_orphan_candidates_file_is_empty()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Compute/disks",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk-from-resources",
                "properties": {}
              }
            ]
            """;

        (OrphanedAzureResourceFindingEngine sut, FindingAnalysisContext context) = CreateSut(
            CreatePackageWithOrphanCandidates("[]", resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Payload.Should().BeOfType<RequirementFindingPayload>();
        findings[0].Trace.RulesApplied.Should().Contain("orphaned-azure-resource-classifier");
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_no_orphans_present()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Compute/disks",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/disks/disk1",
                "properties": { "managedBy": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1" }
              }
            ]
            """;

        (OrphanedAzureResourceFindingEngine sut, FindingAnalysisContext context) = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_inventory_collection_is_stale()
    {
        Guid packageId = Guid.NewGuid();
        Mock<IAzureExtractorPackageRepository> packageRepository = new();

        OrphanedAzureResourceFindingEngine sut = new(
            CreateScopeProvider().Object,
            packageRepository.Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));

        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(
            packageId,
            DateTime.UtcNow.AddDays(-120));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().BeEmpty();
        packageRepository.Verify(
            repo => repo.TryGetDownloadByPackageIdAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task AnalyzeAsync_throws_ConflictException_when_pinned_package_missing()
    {
        Guid packageId = Guid.NewGuid();
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        EffectfulFindingEngineTestSupport.SetupAzurePinnedDownloadMissing(packageRepository, TestScope, packageId);

        OrphanedAzureResourceFindingEngine sut = new(
            CreateScopeProvider().Object,
            packageRepository.Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));

        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(packageId);

        Func<Task> act = () => sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_resources_json_missing()
    {
        (OrphanedAzureResourceFindingEngine sut, FindingAnalysisContext context) = CreateSut(CreatePackageWithoutResourcesJson());

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_package_bytes_are_not_a_valid_zip()
    {
        AzureExtractorPackageDownloadRecord package = new()
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "inventory.zip",
            PackageBytes = [0x00, 0x01, 0x02, 0x03],
        };

        (OrphanedAzureResourceFindingEngine sut, FindingAnalysisContext context) = CreateSut(package);

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static (OrphanedAzureResourceFindingEngine Engine, FindingAnalysisContext Context) CreateSut(
        AzureExtractorPackageDownloadRecord package)
    {
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        EffectfulFindingEngineTestSupport.SetupAzurePinnedDownload(packageRepository, TestScope, package);

        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(package.PackageId);

        OrphanedAzureResourceFindingEngine engine = new(
            CreateScopeProvider().Object,
            packageRepository.Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));

        return (engine, context);
    }

    private static Mock<IScopeContextProvider> CreateScopeProvider()
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);
        return scopeProvider;
    }

    private static AzureExtractorPackageDownloadRecord CreatePackage(string resourcesJson)
    {
        return new AzureExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "inventory.zip",
            PackageBytes = BuildZip(("resources.json", resourcesJson)),
        };
    }

    private static AzureExtractorPackageDownloadRecord CreatePackageWithoutResourcesJson()
    {
        return new AzureExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "inventory.zip",
            PackageBytes = BuildZip(("manifest.json", "{}")),
        };
    }

    private static AzureExtractorPackageDownloadRecord CreatePackageWithOrphanCandidates(
        string orphanCandidatesJson,
        string resourcesJson)
    {
        return new AzureExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "inventory.zip",
            PackageBytes = BuildZip(
                ("orphan-candidates.json", orphanCandidatesJson),
                ("resources.json", resourcesJson)),
        };
    }

    private static byte[] BuildZip(params (string Name, string Content)[] entries)
    {
        using MemoryStream stream = new();
        using (ZipArchive archive = new(stream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach ((string name, string content) in entries)
            {
                ZipArchiveEntry entry = archive.CreateEntry(name);
                using StreamWriter writer = new(entry.Open(), Encoding.UTF8);
                writer.Write(content);
            }
        }

        return stream.ToArray();
    }
}
