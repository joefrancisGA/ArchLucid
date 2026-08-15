using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Findings;
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

[Trait("Category", "Unit")]
public sealed class AzureInventorySecurityBaselineFindingEngineTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task AnalyzeAsync_emits_security_baseline_finding_from_resources_json()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/publicsa",
                "properties": {
                  "allowBlobPublicAccess": true
                }
              }
            ]
            """;

        AzureInventorySecurityBaselineFindingEngine sut = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].FindingType.Should().Be("AzureInventorySecurityBaseline");
        findings[0].EngineType.Should().Be("azure-inventory-security-baseline");
        findings[0].Category.Should().Be("Security");
        findings[0].Payload.Should().BeOfType<RequirementFindingPayload>();
    }

    [Fact]
    public async Task AnalyzeAsync_links_related_topology_node_when_resource_id_matches_graph()
    {
        const string resourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/publicsa";

        const string resourcesJson =
            $$"""
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "{{resourceId}}",
                "properties": {
                  "allowBlobPublicAccess": true
                }
              }
            ]
            """;

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "topology-storage-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "publicsa",
                    Properties = new Dictionary<string, string> { ["resourceId"] = resourceId },
                },
            ],
        };

        AzureInventorySecurityBaselineFindingEngine sut = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].RelatedNodeIds.Should().ContainSingle().Which.Should().Be("topology-storage-1");
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_no_inventory_download()
    {
        AzureInventorySecurityBaselineFindingEngine sut = CreateSut(null);

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static AzureInventorySecurityBaselineFindingEngine CreateSut(
        AzureExtractorPackageDownloadRecord? package)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(static repository =>
                repository.TryGetLatestCollectionTimestampUtcInScopeAsync(
                    It.IsAny<ScopeContext>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);

        packageRepository
            .Setup(static repository =>
                repository.TryGetLatestDownloadInScopeAsync(
                    It.IsAny<ScopeContext>(),
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(package);

        return new AzureInventorySecurityBaselineFindingEngine(
            scopeProvider.Object,
            packageRepository.Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 30 }));
    }

    private static AzureExtractorPackageDownloadRecord CreatePackage(string resourcesJson)
    {
        return new AzureExtractorPackageDownloadRecord
        {
            PackageBytes = BuildZip(("resources.json", resourcesJson)),
        };
    }

    private static byte[] BuildZip(params (string Name, string Content)[] entries)
    {
        using MemoryStream zipStream = new();

        using (ZipArchive archive = new(zipStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach ((string name, string content) in entries)
            {
                ZipArchiveEntry entry = archive.CreateEntry(name, CompressionLevel.Optimal);

                using Stream entryStream = entry.Open();

                entryStream.Write(Encoding.UTF8.GetBytes(content));
            }
        }

        return zipStream.ToArray();
    }
}
