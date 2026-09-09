using System.IO.Compression;
using System.Text;

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
public sealed class ProseAssumptionContradictionServiceTests
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
    public async Task EmitContradictionsAsync_emits_declaration_premise_conflict_with_doc_evidence_ref()
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

        AzureExtractorPackageDownloadRecord package = CreateAzurePackage(resourcesJson);
        FindingAnalysisContext context = EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(package.PackageId);

        ProseAssumptionContradictionService service = CreateService(package);

        List<ProseAssumptionCandidate> candidates =
        [
            new()
            {
                Statement = "The storage account must not be public.",
                DocumentPath = "architecture.md",
                LineNumber = 1,
                QuotedSpan = "must not be public",
                LogicalPropertyName = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                ImpliedPropertyValue = "Disabled",
            },
        ];

        ProseAssumptionContradictionOutcome outcome = await service.EmitOutcomeAsync(
            candidates,
            CreateStorageGraph(),
            context,
            maxFindings: 8,
            maxRegisterEntries: 8,
            CancellationToken.None);

        Finding finding = outcome.Findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("declaration-premise-conflict");
        finding.EvidenceRefs.Should().Contain("doc:architecture.md#L1");
        finding.EvidenceRefs.Should().Contain(StorageArmId);

        DeclarationPremiseConflictFindingPayload payload =
            finding.Payload.Should().BeOfType<DeclarationPremiseConflictFindingPayload>().Subject;
        payload.Source.Should().Be("prose-assumption");
    }

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
