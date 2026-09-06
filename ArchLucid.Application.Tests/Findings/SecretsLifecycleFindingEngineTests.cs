using System.IO.Compression;
using System.Text;

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
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class SecretsLifecycleFindingEngineTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    private static readonly DateTimeOffset FixedNow = new(2026, 9, 6, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task AnalyzeAsync_emits_finding_when_secret_is_stale_and_graph_references_secret_name()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.KeyVault/vaults/secrets",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/pay-kv/secrets/db-password",
                "name": "db-password",
                "properties": {
                  "attributes": {
                    "updated": "2026-01-01T00:00:00Z"
                  }
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
                    NodeId = "kv-node",
                    NodeType = GraphNodeTypes.SecurityBaseline,
                    Label = "db-password",
                    SourceId = "azurerm_key_vault_secret.db_password",
                },
            ],
        };

        (SecretsLifecycleFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        Finding finding = findings.Should().ContainSingle().Subject;
        finding.EngineType.Should().Be("secrets-lifecycle");
        finding.Category.Should().Be("Security");
        finding.RelatedNodeIds.Should().ContainSingle().Which.Should().Be("kv-node");

        SecretsLifecycleFindingPayload payload =
            finding.Payload.Should().BeOfType<SecretsLifecycleFindingPayload>().Subject;
        payload.SecretName.Should().Be("db-password");
        payload.VaultName.Should().Be("pay-kv");
        payload.Cloud.Should().Be("Azure");
        payload.DaysStale.Should().BeGreaterThanOrEqualTo(SecretsLifecycleThresholds.StaleRotationDays);
        finding.Trace.Notes.Should().Contain(note => note.StartsWith("evidence:", StringComparison.Ordinal));
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_secret_is_stale_but_graph_does_not_reference_it()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.KeyVault/vaults/secrets",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/pay-kv/secrets/unreferenced-secret",
                "name": "unreferenced-secret",
                "properties": {
                  "attributes": {
                    "updated": "2026-01-01T00:00:00Z"
                  }
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
                    NodeId = "other-node",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "unrelated-app",
                },
            ],
        };

        (SecretsLifecycleFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_secret_rotation_is_fresh()
    {
        const string resourcesJson =
            """
            [
              {
                "resourceType": "Microsoft.KeyVault/vaults/secrets",
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/pay-kv/secrets/db-password",
                "name": "db-password",
                "properties": {
                  "attributes": {
                    "updated": "2026-09-01T00:00:00Z"
                  }
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
                    NodeId = "kv-node",
                    NodeType = GraphNodeTypes.SecurityBaseline,
                    Label = "db-password",
                },
            ],
        };

        (SecretsLifecycleFindingEngine sut, FindingAnalysisContext context) =
            CreateSut(CreateAzurePackage(resourcesJson));

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task AnalyzeAsync_returns_empty_when_extractor_package_is_not_pinned()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "kv-node",
                    NodeType = GraphNodeTypes.SecurityBaseline,
                    Label = "db-password",
                },
            ],
        };

        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        Mock<ICloudInventoryExtractorPackageRepository> cloudRepository = new();
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        SecretsLifecycleFindingEngine sut = new(
            scopeProvider.Object,
            packageRepository.Object,
            cloudRepository.Object,
            new FakeTimeProvider(FixedNow),
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));

        FindingAnalysisContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
        };

        IReadOnlyList<Finding> findings = await sut.AnalyzeAsync(graph, context, CancellationToken.None);

        findings.Should().BeEmpty();
    }

    private static (SecretsLifecycleFindingEngine Engine, FindingAnalysisContext Context) CreateSut(
        AzureExtractorPackageDownloadRecord package)
    {
        Mock<IAzureExtractorPackageRepository> packageRepository = new();
        EffectfulFindingEngineTestSupport.SetupAzurePinnedDownload(packageRepository, TestScope, package);

        Mock<ICloudInventoryExtractorPackageRepository> cloudRepository = new();

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        FindingAnalysisContext context =
            EffectfulFindingEngineTestSupport.CreateAzurePinnedContext(package.PackageId, FixedNow.UtcDateTime);

        SecretsLifecycleFindingEngine engine = new(
            scopeProvider.Object,
            packageRepository.Object,
            cloudRepository.Object,
            new FakeTimeProvider(FixedNow),
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));

        return (engine, context);
    }

    private static AzureExtractorPackageDownloadRecord CreateAzurePackage(string resourcesJson)
    {
        return new AzureExtractorPackageDownloadRecord
        {
            PackageId = Guid.NewGuid(),
            OriginalFileName = "inventory.zip",
            PackageBytes = BuildZip(("resources.json", resourcesJson)),
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
