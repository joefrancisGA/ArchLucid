using System.IO.Compression;
using System.Text;

using ArchLucid.Application;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
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

        (AzureInventorySecurityBaselineFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

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

        (AzureInventorySecurityBaselineFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreatePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().ContainSingle();
        findings[0].RelatedNodeIds.Should().ContainSingle().Which.Should().Be("topology-storage-1");
    }

    [Fact]
    public async Task AnalyzeAsync_throws_ConflictException_when_no_evidence_pin()
    {
        (AzureInventorySecurityBaselineFindingEngine sut, FindingAnalysisContext? context) = CreateSutWithoutPin();

        Func<Task> act = () => sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task AnalyzeAsync_suppresses_public_access_when_soc2_001_only()
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

        (AzureInventorySecurityBaselineFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreatePackage(resourcesJson), CreatePack("soc2-001"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_public_access_with_cis_az_006()
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

        (AzureInventorySecurityBaselineFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreatePackage(resourcesJson), CreatePack("cis-az-006"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(new GraphSnapshot(), context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.PolicyRuleId.Should().Be("cis-az-006");
        finding.Trace.RulesApplied.Should().Contain("data-protection");
    }

    private static (AzureInventorySecurityBaselineFindingEngine Engine, FindingAnalysisContext Context) CreateSut(
        AzureExtractorPackageDownloadRecord package,
        ComplianceRulePack? rulePack = null)
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
        EffectfulFindingEngineTestSupport.SetupAzurePinnedDownload(packageRepository, TestScope, package);

        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(package.PackageId);

        AzureInventorySecurityBaselineFindingEngine engine = new(
            scopeProvider.Object,
            packageRepository.Object,
            new StubComplianceRulePackProvider(rulePack ?? CreateFailOpenPack()),
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 30 }));

        return (engine, context);
    }

    private static (AzureInventorySecurityBaselineFindingEngine Engine, FindingAnalysisContext? Context) CreateSutWithoutPin()
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

        AzureInventorySecurityBaselineFindingEngine engine = new(
            scopeProvider.Object,
            packageRepository.Object,
            new StubComplianceRulePackProvider(CreateFailOpenPack()),
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 30 }));

        return (engine, null);
    }

    private static AzureExtractorPackageDownloadRecord CreatePackage(string resourcesJson)
    {
        return new AzureExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
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

    private static ComplianceRulePack CreateFailOpenPack() =>
        new()
        {
            RulePackId = "inventory-security-fail-open",
            Name = "Inventory security fail-open",
            Version = "1",
            Rules =
            [
                new ComplianceRule
                {
                    RuleId = "cost-opt-001",
                    ControlId = "c",
                    ControlName = "n",
                    AppliesToCategory = "cat",
                    RequiredNodeType = "t",
                    RequiredEdgeType = "e",
                    Description = "d",
                },
            ],
        };

    private static ComplianceRulePack CreatePack(params string[] ruleIds) =>
        new()
        {
            RulePackId = "inventory-security-policy-test",
            Name = "Inventory security policy test",
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

    private sealed class StubComplianceRulePackProvider(ComplianceRulePack pack) : IComplianceRulePackProvider
    {
        private readonly ComplianceRulePack _pack = pack ?? throw new ArgumentNullException(nameof(pack));

        public Task<ComplianceRulePack> GetRulePackAsync(CancellationToken ct) => Task.FromResult(_pack);
    }
}
