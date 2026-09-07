using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Compliance.Loaders;
using ArchLucid.Decisioning.Compliance.Models;
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
public sealed class PolicyDeclarationInventoryContradictionFindingEngineTests
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
    public async Task AnalyzeAsync_emits_one_finding_when_mismatch_theme_maps_to_assigned_pack_rule()
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

        (PolicyDeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson), CreatePack("cis-az-006"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("policy-declaration-inventory-contradiction");
        finding.PolicyRuleId.Should().Be("cis-az-006");
        finding.Title.Should().Contain("cis-az-006");
        finding.Title.Should().Contain("stpayprod");
        finding.Title.Should().Contain("Disabled");
        finding.Title.Should().Contain("Enabled");
        finding.Trace.Notes.Should().Contain($"evidence:inventory:{StorageArmId}");
        finding.Trace.Notes.Should().Contain("evidence:graph-node:storage-1");
        finding.Trace.Notes.Should().Contain("evidence:policy:cis-az-006");

        PolicyDeclarationInventoryContradictionFindingPayload payload =
            finding.Payload.Should().BeOfType<PolicyDeclarationInventoryContradictionFindingPayload>().Subject;

        payload.PolicyRuleId.Should().Be("cis-az-006");
        payload.CloudProvider.Should().Be("Azure");
        payload.DeclarationKey.Should().Be("tf.public_network_access");
        payload.DeclaredValue.Should().Be("Disabled");
        payload.InventoryValue.Should().Be("Enabled");
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_assigned_pack_has_no_mapped_rule_for_theme()
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

        (PolicyDeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson), CreatePack("cost-opt-001"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_assigned_pack_is_empty()
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

        (PolicyDeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson), CreatePack());

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_declaration_does_not_claim_secure_posture()
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

        (PolicyDeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson), CreatePack("cis-az-006"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_inventory_collection_is_stale()
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

        AzureExtractorPackageDownloadRecord package = CreateAzurePackage(resourcesJson);
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);

        EffectfulFindingEngineTestSupport.SetupAzurePinnedDownload(packageRepository, TestScope, package);

        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(
            package.PackageId,
            DateTime.UtcNow.AddDays(-120));

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        PolicyDeclarationInventoryContradictionFindingEngine sut = new(
            scopeProvider.Object,
            packageRepository.Object,
            new Mock<ICloudInventoryExtractorPackageRepository>().Object,
            new StubComplianceRulePackProvider(CreatePack("cis-az-006")),
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

    private static (PolicyDeclarationInventoryContradictionFindingEngine Engine, FindingAnalysisContext Context) CreateSut(
        AzureExtractorPackageDownloadRecord package,
        ComplianceRulePack rulePack)
    {
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        EffectfulFindingEngineTestSupport.SetupAzurePinnedDownload(packageRepository, TestScope, package);

        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(package.PackageId);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        PolicyDeclarationInventoryContradictionFindingEngine engine = new(
            scopeProvider.Object,
            packageRepository.Object,
            new Mock<ICloudInventoryExtractorPackageRepository>().Object,
            new StubComplianceRulePackProvider(rulePack),
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

    private static ComplianceRulePack CreatePack(params string[] ruleIds) =>
        new()
        {
            RulePackId = "test-pack",
            Name = "Test",
            Version = "1",
            Rules = ruleIds
                .Select(
                    static ruleId => new ComplianceRule
                    {
                        RuleId = ruleId,
                        ControlId = "c",
                        ControlName = "n",
                        AppliesToCategory = "cat",
                        RequiredNodeType = "t",
                        RequiredEdgeType = "e",
                        Description = "d",
                    })
                .ToList(),
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

    private sealed class StubComplianceRulePackProvider(ComplianceRulePack pack) : IComplianceRulePackProvider
    {
        private readonly ComplianceRulePack _pack = pack ?? throw new ArgumentNullException(nameof(pack));

        public Task<ComplianceRulePack> GetRulePackAsync(CancellationToken ct) => Task.FromResult(_pack);
    }
}
