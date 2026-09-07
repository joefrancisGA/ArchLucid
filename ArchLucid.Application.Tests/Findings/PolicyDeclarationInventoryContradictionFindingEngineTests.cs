using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
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

    private const string AksArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks-prod";

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
        finding.EvidenceRefs.Should().Contain("policy-rule:cis-az-006");
        finding.EvidenceRefs.Should().Contain(StorageArmId);

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

    [Fact]
    public async Task AnalyzeAsync_emits_encryption_finding_when_cis_aws_007_pack_maps_theme()
    {
        const string rdsArn = "arn:aws:rds:us-east-1:123456789012:db:pay-db";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "rds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "pay-db",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = rdsArn,
                        ["tf.storage_encrypted"] = "true",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "name": "arn:aws:rds:us-east-1:123456789012:db:pay-db",
                "resourceType": "AWS::RDS::DBInstance",
                "properties": {
                  "storageEncrypted": false
                }
              }
            ]
            """;

        (PolicyDeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateAwsSut(CreateAwsPackage(resourcesJson), CreatePack("cis-aws-007"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.PolicyRuleId.Should().Be("cis-aws-007");
        finding.Payload.Should().BeOfType<PolicyDeclarationInventoryContradictionFindingPayload>()
            .Which.DeclarationKey.Should().Be("tf.storage_encrypted");
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_for_encryption_mismatch_when_only_soc2_001_assigned()
    {
        const string rdsArn = "arn:aws:rds:us-east-1:123456789012:db:pay-db";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "rds-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "pay-db",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = rdsArn,
                        ["tf.storage_encrypted"] = "true",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "name": "arn:aws:rds:us-east-1:123456789012:db:pay-db",
                "resourceType": "AWS::RDS::DBInstance",
                "properties": {
                  "storageEncrypted": false
                }
              }
            ]
            """;

        (PolicyDeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateAwsSut(CreateAwsPackage(resourcesJson), CreatePack("soc2-001"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_network_isolation_finding_when_cis_az_018_pack_maps_theme()
    {
        GraphSnapshot graph = new()
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
                        ["tf.networkacls"] = """{"defaultaction":"deny"}""",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                "properties": {
                  "defaultAction": "Allow"
                }
              }
            ]
            """;

        (PolicyDeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson), CreatePack("cis-az-018"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.PolicyRuleId.Should().Be("cis-az-018");
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_for_network_mismatch_when_only_encryption_pack_assigned()
    {
        GraphSnapshot graph = new()
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
                        ["tf.networkacls"] = """{"defaultaction":"deny"}""",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                "properties": {
                  "defaultAction": "Allow"
                }
              }
            ]
            """;

        (PolicyDeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson), CreatePack("soc2-003"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_emits_workload_isolation_finding_when_aks_009_pack_maps_theme()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "deploy-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "payment-api",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = AksArmId,
                        ["k8s.privileged"] = "false",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "name": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks-prod",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks-prod",
                "resourceType": "apps/v1/Deployment",
                "properties": {
                  "privileged": true
                }
              }
            ]
            """;

        (PolicyDeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson), CreatePack("aks-009"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.PolicyRuleId.Should().Be("aks-009");
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_for_workload_mismatch_when_only_data_protection_pack_assigned()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "deploy-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "payment-api",
                    Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["resourceId"] = AksArmId,
                        ["k8s.privileged"] = "false",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "name": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks-prod",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerService/managedClusters/aks-prod",
                "resourceType": "apps/v1/Deployment",
                "properties": {
                  "privileged": true
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
    public async Task AnalyzeAsync_emits_transport_security_finding_for_https_mismatch()
    {
        GraphSnapshot graph = new()
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
                        ["tf.https_only"] = "true",
                    },
                },
            ],
        };

        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.Storage/storageAccounts",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod",
                "properties": {
                  "supportsHttpsTrafficOnly": false
                }
              }
            ]
            """;

        (PolicyDeclarationInventoryContradictionFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson), CreatePack("cis-az-025"));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.PolicyRuleId.Should().Be("cis-az-025");
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

    private static (PolicyDeclarationInventoryContradictionFindingEngine Engine, FindingAnalysisContext Context) CreateAwsSut(
        CloudInventoryExtractorPackageDownloadRecord package,
        ComplianceRulePack rulePack)
    {
        Mock<IAzureExtractorPackageRepository> azurePackageRepository = new();

        Mock<ICloudInventoryExtractorPackageRepository> cloudPackageRepository = new();
        cloudPackageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(
                TestScope,
                CloudProvider.Aws,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        EffectfulFindingEngineTestSupport.SetupCloudPinnedDownload(
            cloudPackageRepository,
            TestScope,
            CloudProvider.Aws,
            package);

        FindingAnalysisContext context = new()
        {
            RunId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            ContextSnapshotId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            EvidencePins =
            [
                new EvidencePackagePin
                {
                    Provider = RunEvidencePackagePinService.AzureProvider,
                    PackageId = Guid.NewGuid(),
                    CollectionUtc = DateTime.UtcNow,
                },
                new EvidencePackagePin
                {
                    Provider = RunEvidencePackagePinService.AwsProvider,
                    PackageId = package.PackageId,
                    CollectionUtc = DateTime.UtcNow,
                },
            ],
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        PolicyDeclarationInventoryContradictionFindingEngine engine = new(
            scopeProvider.Object,
            azurePackageRepository.Object,
            cloudPackageRepository.Object,
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

    private static CloudInventoryExtractorPackageDownloadRecord CreateAwsPackage(string resourcesJson) =>
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
