using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Architecture;
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
public sealed class DeclarationInventoryContradictionFindingEngineTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private const string StorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod";

    [Fact]
    public async Task AnalyzeAsync_emits_one_finding_when_public_network_access_disagrees()
    {
        GraphSnapshot graph = CreateStorageGraph("Disabled");

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                "properties": {
                  "publicNetworkAccess": "Enabled"
                }
              }
            ]
            """;

        (DeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("declaration-inventory-contradiction");
        finding.Title.Should().Contain("stpayprod");
        finding.Title.Should().Contain("Disabled");
        finding.Title.Should().Contain("Enabled");
        finding.Trace.Notes.Should().Contain($"evidence:inventory:{StorageArmId}");
        finding.Trace.Notes.Should().Contain("evidence:graph-node:storage-1");

        DeclarationInventoryContradictionFindingPayload payload =
            finding.Payload.Should().BeOfType<DeclarationInventoryContradictionFindingPayload>().Subject;
        payload.Cloud.Should().Be("Azure");
        payload.DeclarationKey.Should().Be("tf.public_network_access");
        payload.DeclarationValue.Should().Be("Disabled");
        payload.InventoryValue.Should().Be("Enabled");
    }

    [Fact]
    public async Task AnalyzeAsync_emits_one_finding_for_inverse_public_network_access_mismatch()
    {
        GraphSnapshot graph = CreateStorageGraph("Enabled");

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                "properties": {
                  "publicNetworkAccess": "Disabled"
                }
              }
            ]
            """;

        (DeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].Title.Should().Contain("Enabled");
        findings[0].Title.Should().Contain("Disabled");
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_declaration_and_inventory_values_match()
    {
        GraphSnapshot graph = CreateStorageGraph("Disabled");

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                "properties": {
                  "publicNetworkAccess": "Disabled"
                }
              }
            ]
            """;

        (DeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_inventory_package_is_missing()
    {
        GraphSnapshot graph = CreateStorageGraph("Disabled");

        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);

        Guid packageId = Guid.NewGuid();
        EffectfulFindingEngineTestSupport.SetupAzurePinnedDownloadMissing(packageRepository, TestScope, packageId);

        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(packageId);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        DeclarationInventoryContradictionFindingEngine sut = new(
            scopeProvider.Object,
            packageRepository.Object,
            new Mock<ICloudInventoryExtractorPackageRepository>().Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static GraphSnapshot CreateStorageGraph(string publicNetworkAccess) => new()
    {
        Nodes =
        [
            new GraphNode
            {
                NodeId = "storage-1",
                NodeType = GraphNodeTypes.TopologyResource,
                Label = "stpayprod",
                Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    ["resourceId"] = StorageArmId,
                    ["tf.public_network_access"] = publicNetworkAccess,
                },
            },
        ],
    };

    private static (DeclarationInventoryContradictionFindingEngine Engine, FindingAnalysisContext Context) CreateSut(
        AzureExtractorPackageDownloadRecord package)
    {
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        EffectfulFindingEngineTestSupport.SetupAzurePinnedDownload(packageRepository, TestScope, package);

        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(package.PackageId);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        DeclarationInventoryContradictionFindingEngine engine = new(
            scopeProvider.Object,
            packageRepository.Object,
            new Mock<ICloudInventoryExtractorPackageRepository>().Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));

        return (engine, context);
    }

    private static AzureExtractorPackageDownloadRecord CreateAzurePackage(string resourcesJson) =>
        new()
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "inventory.zip",
            PackageBytes = BuildZip(("resources.json", resourcesJson)),
        };

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
