using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Common;
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
public sealed class GraphGcpInventoryReconciliationFindingEngineTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private const string GraphResourceId =
        "projects/demo-project/zones/us-central1-a/instances/graph-vm";

    [Fact]
    public async Task AnalyzeAsync_emits_reconciliation_finding_when_sets_differ()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        const string resourcesJson =
            """
            [
              {
                "name": "projects/demo-project/global/networks/live-vpc"
              }
            ]
            """;

        GraphGcpInventoryReconciliationFindingEngine sut = CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("gcp-inventory-reconciliation");
        finding.RelatedNodeIds.Should().ContainSingle().Which.Should().Be("t1");
        InventoryReconciliationFindingPayload payload =
            finding.Payload.Should().BeOfType<InventoryReconciliationFindingPayload>().Subject;
        payload.GraphOnlyResourceIds.Should().ContainSingle();
        payload.InventoryOnlyResourceIds.Should().ContainSingle();
    }

    [Fact]
    public async Task AnalyzeAsync_reports_graph_only_when_download_row_is_missing()
    {
        GraphSnapshot graph = CreateGraphWithResourceId(GraphResourceId);

        GraphGcpInventoryReconciliationFindingEngine sut = CreateSut(null);

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.RelatedNodeIds.Should().ContainSingle().Which.Should().Be("t1");
        InventoryReconciliationFindingPayload payload =
            finding.Payload.Should().BeOfType<InventoryReconciliationFindingPayload>().Subject;
        payload.GraphOnlyResourceIds.Should().ContainSingle();
        payload.InventoryOnlyResourceIds.Should().BeEmpty();
    }

    private static GraphGcpInventoryReconciliationFindingEngine CreateSut(
        CloudInventoryExtractorPackageDownloadRecord? package)
    {
        Mock<ICloudInventoryExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(
                TestScope,
                CloudProvider.Gcp,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        packageRepository
            .Setup(repo => repo.TryGetLatestDownloadInScopeAsync(
                TestScope,
                CloudProvider.Gcp,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(package);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        return new GraphGcpInventoryReconciliationFindingEngine(
            scopeProvider.Object,
            packageRepository.Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));
    }

    private static CloudInventoryExtractorPackageDownloadRecord CreatePackage(string resourcesJson)
    {
        return new CloudInventoryExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "gcp-inventory.zip",
            PackageBytes = BuildZip(("resources.json", resourcesJson)),
        };
    }

    private static GraphSnapshot CreateGraphWithResourceId(string resourceId)
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "t1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vm",
                    Properties = new Dictionary<string, string>
                    {
                        ["gcpResourceId"] = resourceId
                    }
                }
            ]
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
