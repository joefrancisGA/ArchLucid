using ArchLucid.Application.InfraEvidence;
using ArchLucid.ContextIngestion.Diagram;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class InfrastructureDiagramComparisonServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("88888888-9999-aaaa-bbbb-cccccccccccc");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task CompareAsync_parses_mermaid_without_sealed_manifest_guard()
    {
        Guid resourceRowId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        Guid cloudResourceId = Guid.Parse("22222222-3333-4444-5555-666666666666");

        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(
            [
                CreateResource(
                    resourceRowId,
                    cloudResourceId,
                    "stprodmemberportal01",
                    "rg-app",
                    "Microsoft.Storage/storageAccounts"),
            ]);

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        Mock<IInfrastructureDiagramComparisonRepository> comparisonRepository = new();
        List<InfrastructureDiagramComparisonPersistRecord> persistedComparisons = [];
        comparisonRepository
            .Setup(repository => repository.TryGetAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((InfrastructureDiagramComparisonPersistRecord?)null);
        comparisonRepository
            .Setup(repository => repository.UpsertAsync(
                It.IsAny<InfrastructureDiagramComparisonPersistRecord>(),
                It.IsAny<CancellationToken>()))
            .Callback<InfrastructureDiagramComparisonPersistRecord, CancellationToken>(
                (record, _) => persistedComparisons.Add(record))
            .Returns(Task.CompletedTask);

        Mock<IInfrastructureDiagramNodeMappingRepository> mappingRepository = new();
        mappingRepository
            .Setup(repository => repository.ListBySnapshotAsync(It.IsAny<Guid>(), SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        InfrastructureDiagramComparisonService service = new(
            new StructuredDiagramParseRouter([new MermaidDiagramSourceParser()]),
            snapshotRepository.Object,
            comparisonRepository.Object,
            mappingRepository.Object,
            new Mock<IInfrastructureDiagramDocumentationDecisionRepository>().Object);

        ScopeContext scope = new() { TenantId = TenantId };

        string mermaid = """
            flowchart LR
              portal["stprodmemberportal01 (rg-app)"]
              missing["Member Portal — Prod"]
              portal --> missing
            """;

        DiagramInfrastructureReconciliationResult result = await service.CompareAsync(
            scope,
            new InfrastructureDiagramComparisonCreateRequest
            {
                SnapshotId = SnapshotId,
                Sources =
                [
                    new DiagramSourceReference
                    {
                        Name = "week-3",
                        Format = "text/vnd.mermaid",
                        Content = mermaid,
                    },
                ],
            },
            savedByUserOid: null);

        result.ComparisonId.Should().NotBeNull();
        result.RunId.Should().Be(Guid.Empty);
        result.Rows.Should().Contain(row => row.MatchKind == DiagramInfrastructureMatchKinds.Exact);
        result.Rows.Should().Contain(row => row.MatchKind == DiagramInfrastructureMatchKinds.DiagramOnly);
        persistedComparisons.Should().ContainSingle()
            .Which.DiagramFingerprint.Should().MatchRegex("^[0-9a-f]{64}$");
    }

    [Fact]
    public async Task CompareAsync_fingerprint_is_stable_for_same_model_and_changes_when_label_changes()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot([]);
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        Mock<IInfrastructureDiagramComparisonRepository> comparisonRepository = new();
        List<InfrastructureDiagramComparisonPersistRecord> persistedComparisons = [];
        comparisonRepository
            .Setup(repository => repository.TryGetAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((InfrastructureDiagramComparisonPersistRecord?)null);
        comparisonRepository
            .Setup(repository => repository.UpsertAsync(
                It.IsAny<InfrastructureDiagramComparisonPersistRecord>(),
                It.IsAny<CancellationToken>()))
            .Callback<InfrastructureDiagramComparisonPersistRecord, CancellationToken>(
                (record, _) => persistedComparisons.Add(record))
            .Returns(Task.CompletedTask);

        Mock<IInfrastructureDiagramNodeMappingRepository> mappingRepository = new();
        mappingRepository
            .Setup(repository => repository.ListBySnapshotAsync(It.IsAny<Guid>(), SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        InfrastructureDiagramComparisonService service = new(
            new StructuredDiagramParseRouter([new MermaidDiagramSourceParser()]),
            snapshotRepository.Object,
            comparisonRepository.Object,
            mappingRepository.Object,
            new Mock<IInfrastructureDiagramDocumentationDecisionRepository>().Object);

        ScopeContext scope = new() { TenantId = TenantId };
        await service.CompareAsync(scope, CreateRequest("""
            flowchart LR
              app["Application"]
              db["Database"]
              app -->|reads| db
            """), savedByUserOid: null);
        await service.CompareAsync(scope, CreateRequest("""
            flowchart LR
              db["Database"]
              app["Application"]
              app -->|reads| db
            """), savedByUserOid: null);
        await service.CompareAsync(scope, CreateRequest("""
            flowchart LR
              app["Application v2"]
              db["Database"]
              app -->|reads| db
            """), savedByUserOid: null);

        persistedComparisons.Should().HaveCount(3);
        persistedComparisons[0].DiagramFingerprint.Should().Be(persistedComparisons[1].DiagramFingerprint);
        persistedComparisons[2].DiagramFingerprint.Should().NotBe(persistedComparisons[0].DiagramFingerprint);
    }

    private static InfrastructureDiagramComparisonCreateRequest CreateRequest(string mermaid) =>
        new()
        {
            SnapshotId = SnapshotId,
            Sources =
            [
                new DiagramSourceReference
                {
                    Name = "fingerprint-test",
                    Format = "text/vnd.mermaid",
                    Content = mermaid,
                },
            ],
        };

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        IReadOnlyList<AzureInventoryResourceRecord> resources) =>
        new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                WorkspaceId = Guid.Parse("99999999-aaaa-bbbb-cccc-dddddddddddd"),
                ProjectId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
                PackageId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000001"),
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources = resources,
        };

    private static AzureInventoryResourceRecord CreateResource(
        Guid resourceRowId,
        Guid cloudResourceId,
        string resourceName,
        string resourceGroup,
        string resourceType) =>
        new()
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            CloudResourceId = cloudResourceId,
            AzureResourceId =
                $"/subscriptions/sub/resourceGroups/{resourceGroup}/providers/{resourceType}/{resourceName}",
            ResourceType = resourceType,
            ResourceGroup = resourceGroup,
            SubscriptionId = "sub",
        };
}
