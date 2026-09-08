using System.IO.Compression;
using System.Text;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.Findings.ProseAssumption;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class ProseAssumptionRegisterTests
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
    public async Task EmitOutcomeAsync_contradicted_candidate_emits_finding_and_register_row_with_finding_id()
    {
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

        ProseAssumptionCandidate candidate = CreatePublicAccessCandidate();
        AzureExtractorPackageDownloadRecord package = CreateAzurePackage(resourcesJson);
        ProseAssumptionContradictionService service = CreateService(package);
        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(package.PackageId);

        ProseAssumptionContradictionOutcome outcome = await service.EmitOutcomeAsync(
            [candidate],
            CreateStorageGraph(),
            context,
            maxFindings: 8,
            maxRegisterEntries: 8,
            CancellationToken.None);

        Finding finding = outcome.Findings.Should().ContainSingle().Subject;
        ProseAssumptionRegisterEntry registerEntry = outcome.RegisterEntries.Should().ContainSingle().Subject;
        registerEntry.Disposition.Should().Be(ProseAssumptionDisposition.Contradicted);
        registerEntry.FindingId.Should().Be(finding.FindingId);
        registerEntry.EvidenceRef.Should().Be("doc:architecture.md#L1");
    }

    [Fact]
    public async Task EmitOutcomeAsync_consistent_inventory_emits_register_row_without_finding()
    {
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

        ProseAssumptionCandidate candidate = CreatePublicAccessCandidate();
        AzureExtractorPackageDownloadRecord package = CreateAzurePackage(resourcesJson);
        ProseAssumptionContradictionService service = CreateService(package);
        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(package.PackageId);

        ProseAssumptionContradictionOutcome outcome = await service.EmitOutcomeAsync(
            [candidate],
            CreateStorageGraph(),
            context,
            maxFindings: 8,
            maxRegisterEntries: 8,
            CancellationToken.None);

        outcome.Findings.Should().BeEmpty();
        ProseAssumptionRegisterEntry registerEntry = outcome.RegisterEntries.Should().ContainSingle().Subject;
        registerEntry.Disposition.Should().Be(ProseAssumptionDisposition.Consistent);
        registerEntry.FindingId.Should().BeNull();
        registerEntry.EvidenceRef.Should().Be("doc:architecture.md#L1");
    }

    [Fact]
    public async Task EmitOutcomeAsync_unmapped_candidate_emits_not_verifiable_register_row()
    {
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

        List<ProseAssumptionCandidate> candidates =
        [
            new()
            {
                Statement = "The payment provider owns PCI scope.",
                DocumentPath = "architecture.md",
                LineNumber = 2,
                QuotedSpan = "owns PCI scope",
            },
        ];

        ProseAssumptionContradictionService service = CreateService(CreateAzurePackage(resourcesJson));
        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(
            CreateAzurePackage(resourcesJson).PackageId);

        ProseAssumptionContradictionOutcome outcome = await service.EmitOutcomeAsync(
            candidates,
            CreateStorageGraph(),
            context,
            maxFindings: 8,
            maxRegisterEntries: 8,
            CancellationToken.None);

        outcome.Findings.Should().BeEmpty();
        ProseAssumptionRegisterEntry registerEntry = outcome.RegisterEntries.Should().ContainSingle().Subject;
        registerEntry.Disposition.Should().Be(ProseAssumptionDisposition.NotVerifiable);
        registerEntry.LogicalPropertyName.Should().BeNull();
    }

    [Fact]
    public void HasConsistentInventoryMatch_returns_true_when_inventory_matches_prose_value()
    {
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

        bool consistent = ProseAssumptionContradictionPass.HasConsistentInventoryMatch(
            InventoryTopologyCloudProvider.Azure,
            resourcesJson,
            CreateStorageGraph(),
            CreatePublicAccessCandidate());

        consistent.Should().BeTrue();
    }

    private static ProseAssumptionCandidate CreatePublicAccessCandidate() => new()
    {
        Statement = "The storage account must not be public.",
        DocumentPath = "architecture.md",
        LineNumber = 1,
        QuotedSpan = "must not be public",
        LogicalPropertyName = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
        ImpliedPropertyValue = "Disabled",
    };

    private static ProseAssumptionContradictionService CreateService(AzureExtractorPackageDownloadRecord package)
    {
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        packageRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(TestScope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(DateTime.UtcNow);
        EffectfulFindingEngineTestSupport.SetupAzurePinnedDownload(packageRepository, TestScope, package);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        return new ProseAssumptionContradictionService(
            scopeProvider.Object,
            packageRepository.Object,
            new Mock<ICloudInventoryExtractorPackageRepository>().Object,
            TimeProvider.System,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));
    }

    private static GraphSnapshot CreateStorageGraph() => new()
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
                },
            },
        ],
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
