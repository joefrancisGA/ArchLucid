using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryDiffServiceTests
{
    [Fact]
    public async Task ComputeAndPersistDiffAsync_when_snapshot_pair_already_persisted_still_notifies_diff_consumers()
    {
        ScopeContext scope = CreateScope();
        Guid snapshotAId = Guid.NewGuid();
        Guid snapshotBId = Guid.NewGuid();
        AzureInventoryDiffSummaryRecord existingSummary = new()
        {
            DiffId = Guid.NewGuid(),
            SnapshotAId = snapshotAId,
            SnapshotBId = snapshotBId,
            SubscriptionId = "sub",
            TotalChanges = 1,
        };
        List<AzureInventoryChangeRecord> existingChanges =
        [
            new()
            {
                ChangeId = Guid.NewGuid(),
                ChangeType = AzureInventoryChangeType.PermissionChanged,
                CloudResourceId = Guid.NewGuid(),
            },
        ];

        Mock<IAzureInventoryDiffRepository> diffRepository = new();
        diffRepository
            .Setup(repository => repository.TryGetBySnapshotPairAsync(scope, snapshotAId, snapshotBId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingSummary);
        diffRepository
            .Setup(repository => repository.ListChangesByDiffIdAsync(scope, existingSummary.DiffId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingChanges);

        RecordingDiffConsumer consumer = new();
        AzureInventoryDiffService service = CreateService(
            diffRepository.Object,
            snapshotRepository: null,
            consumers: [consumer]);

        AzureInventoryDiffComputeResult result = await service.ComputeAndPersistDiffAsync(
            scope,
            snapshotAId,
            snapshotBId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.WasExisting.Should().BeTrue();
        consumer.InvocationCount.Should().Be(1);
        consumer.LastSummary.Should().BeEquivalentTo(existingSummary);
        consumer.LastChanges.Should().BeEquivalentTo(existingChanges);
    }

    [Fact]
    public async Task ComputeAndPersistDiffAsync_when_one_consumer_throws_other_consumer_still_runs()
    {
        ScopeContext scope = CreateScope();
        Guid snapshotAId = Guid.NewGuid();
        Guid snapshotBId = Guid.NewGuid();
        Guid resourceRowId = Guid.NewGuid();

        AzureInventorySnapshotDetailReadModel snapshotA = BuildSnapshot(
            snapshotAId,
            resourceRowId,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            tagValue: "prod");

        AzureInventorySnapshotDetailReadModel snapshotB = BuildSnapshot(
            snapshotBId,
            resourceRowId,
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
            tagValue: "staging");

        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, snapshotAId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshotA);
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, snapshotBId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshotB);

        Mock<IAzureInventoryDiffRepository> diffRepository = new();
        diffRepository
            .Setup(repository => repository.TryGetBySnapshotPairAsync(scope, snapshotAId, snapshotBId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AzureInventoryDiffSummaryRecord?)null);
        diffRepository
            .Setup(repository => repository.InsertDiffAsync(scope, It.IsAny<AzureInventoryDiffPersistRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext _, AzureInventoryDiffPersistRequest request, CancellationToken _) =>
                new AzureInventoryDiffPersistResult
                {
                    DiffId = request.DiffId,
                    Summary = request.Summary,
                    WasExisting = false,
                });

        RecordingDiffConsumer recordingConsumer = new();
        ThrowingDiffConsumer throwingConsumer = new();
        AzureInventoryDiffService service = CreateService(
            diffRepository.Object,
            snapshotRepository.Object,
            consumers: [throwingConsumer, recordingConsumer]);

        AzureInventoryDiffComputeResult result = await service.ComputeAndPersistDiffAsync(
            scope,
            snapshotAId,
            snapshotBId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        recordingConsumer.InvocationCount.Should().Be(1);
        throwingConsumer.InvocationCount.Should().Be(1);
    }

    private static AzureInventoryDiffService CreateService(
        IAzureInventoryDiffRepository diffRepository,
        IAzureInventorySnapshotRepository? snapshotRepository,
        IReadOnlyList<IAzureInventoryDiffConsumer> consumers)
    {
        snapshotRepository ??= Mock.Of<IAzureInventorySnapshotRepository>();

        return new AzureInventoryDiffService(
            snapshotRepository,
            diffRepository,
            consumers,
            NullLogger<AzureInventoryDiffService>.Instance);
    }

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        Guid snapshotId,
        Guid resourceRowId,
        string armId,
        string tagValue)
    {
        return new AzureInventorySnapshotDetailReadModel
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = Guid.NewGuid(),
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = resourceRowId,
                    SnapshotId = snapshotId,
                    TenantId = Guid.NewGuid(),
                    AzureResourceId = armId,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                    Region = "eastus",
                },
            ],
            Tags =
            [
                new AzureInventoryTagReadModel
                {
                    ResourceRowId = resourceRowId,
                    TagKey = "env",
                    TagValue = tagValue,
                },
            ],
        };
    }

    private sealed class RecordingDiffConsumer : IAzureInventoryDiffConsumer
    {
        public int InvocationCount { get; private set; }

        public AzureInventoryDiffSummaryRecord? LastSummary { get; private set; }

        public IReadOnlyList<AzureInventoryChangeRecord>? LastChanges { get; private set; }

        public Task OnDiffComputedAsync(
            AzureInventoryDiffSummaryRecord summary,
            IReadOnlyList<AzureInventoryChangeRecord> changes,
            CancellationToken cancellationToken = default)
        {
            InvocationCount++;
            LastSummary = summary;
            LastChanges = changes;
            return Task.CompletedTask;
        }
    }

    private sealed class ThrowingDiffConsumer : IAzureInventoryDiffConsumer
    {
        public int InvocationCount { get; private set; }

        public Task OnDiffComputedAsync(
            AzureInventoryDiffSummaryRecord summary,
            IReadOnlyList<AzureInventoryChangeRecord> changes,
            CancellationToken cancellationToken = default)
        {
            InvocationCount++;
            throw new InvalidOperationException("consumer failed");
        }
    }
}
