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
    public async Task AnalyzeAsync_emits_one_finding_when_mapped_pack_rule_is_active()
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
            CreateSut(CreateAzurePackage(resourcesJson), ["cis-az-006"]);

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("policy-declaration-inventory-contradiction");
        finding.PolicyRuleId.Should().Be("cis-az-006");
        finding.Title.Should().Contain("cis-az-006");
        finding.Title.Should().Contain("stpayprod");
        finding.Trace.Notes.Should().Contain("evidence:policy:cis-az-006");

        PolicyDeclarationInventoryContradictionFindingPayload payload =
            finding.Payload.Should().BeOfType<PolicyDeclarationInventoryContradictionFindingPayload>().Subject;
        payload.PolicyRuleId.Should().Be("cis-az-006");
        payload.DeclaredValue.Should().Be("Disabled");
        payload.InventoryValue.Should().Be("Enabled");
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_active_rule_ids_are_empty()
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
            CreateSut(CreateAzurePackage(resourcesJson), []);

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
            CreateSut(CreateAzurePackage(resourcesJson), ["cis-az-006"]);

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
        IReadOnlyList<string> activeRuleIds)
    {
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        EffectfulFindingEngineTestSupport.SetupAzurePinnedDownload(packageRepository, TestScope, package);

        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(package.PackageId);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<IComplianceRulePackProvider> rulePackProvider = new();
        rulePackProvider
            .Setup(provider => provider.GetRulePackAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateRulePack(activeRuleIds));

        PolicyDeclarationInventoryContradictionFindingEngine engine = new(
            scopeProvider.Object,
            packageRepository.Object,
            new Mock<ICloudInventoryExtractorPackageRepository>().Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }),
            rulePackProvider.Object);

        return (engine, context);
    }

    private static ComplianceRulePack CreateRulePack(IReadOnlyList<string> activeRuleIds) =>
        new()
        {
            RulePackId = "test-pack",
            Name = "Test pack",
            Version = "1",
            RulePackHash = "hash",
            SourcePath = "test",
            Rules = activeRuleIds
                .Select(ruleId => new ComplianceRule { RuleId = ruleId, ControlName = ruleId })
                .ToList(),
        };

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
