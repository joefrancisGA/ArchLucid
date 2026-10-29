using ArchLucid.Application.InfraEvidence;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class SecureNowAnalysisRunTests
{
    private static ScopeContext CreateScope() => new()
    {
        TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid(),
    };

    private static Mock<IAzureInventorySnapshotRepository> CreateRepository()
    {
        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository.Setup(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext scope, Guid id, CancellationToken _) => new AzureInventorySnapshotDetailReadModel
            {
                Header = new() { TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId, SnapshotId = id },
            });
        return repository;
    }

    [Fact]
    public async Task Same_scope_values_share_one_read_and_indexes_within_run_but_reload_next_run()
    {
        ScopeContext scope = CreateScope();
        ScopeContext equivalentScope = new() { TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId };
        Guid id = Guid.NewGuid();
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        SecureNowAnalysisSnapshot? first;
        using (SecureNowAnalysisRun.Begin())
        {
            first = await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
            using (SecureNowAnalysisRun.JoinOrBegin())
            {
                SecureNowAnalysisSnapshot? second = await SecureNowAnalysisRun.LoadAsync(repository.Object, equivalentScope, id, default);
                second.Should().BeSameAs(first);
                second!.ResourcesByArmId.Should().BeSameAs(first!.ResourcesByArmId);
            }
        }
        using (SecureNowAnalysisRun.Begin())
            (await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default)).Should().NotBeSameAs(first);
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Tenant_workspace_project_snapshot_and_repository_each_partition_reuse()
    {
        ScopeContext scope = CreateScope();
        Guid id = Guid.NewGuid();
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        Mock<IAzureInventorySnapshotRepository> otherRepository = CreateRepository();
        using IDisposable run = SecureNowAnalysisRun.Begin();
        SecureNowAnalysisSnapshot? first = await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        foreach (ScopeContext otherScope in new[]
        {
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = scope.WorkspaceId, ProjectId = scope.ProjectId },
            new ScopeContext { TenantId = scope.TenantId, WorkspaceId = Guid.NewGuid(), ProjectId = scope.ProjectId },
            new ScopeContext { TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = Guid.NewGuid() },
        })
        {
            SecureNowAnalysisSnapshot? other = await SecureNowAnalysisRun.LoadAsync(repository.Object, otherScope, id, default);
            other.Should().NotBeSameAs(first);
            other!.Snapshot.Header.TenantId.Should().Be(otherScope.TenantId);
            other.Snapshot.Header.WorkspaceId.Should().Be(otherScope.WorkspaceId);
            other.Snapshot.Header.ProjectId.Should().Be(otherScope.ProjectId);
        }
        (await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, Guid.NewGuid(), default)).Should().NotBeSameAs(first);
        (await SecureNowAnalysisRun.LoadAsync(otherRepository.Object, scope, id, default)).Should().NotBeSameAs(first);
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Exactly(5));
        otherRepository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Outside_run_reads_are_fresh_and_nested_owner_restores_parent_after_exception()
    {
        ScopeContext scope = CreateScope();
        Guid id = Guid.NewGuid();
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        using (SecureNowAnalysisRun.Begin())
        {
            SecureNowAnalysisSnapshot? parent = await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
            Func<Task> nested = async () =>
            {
                using IDisposable nestedRun = SecureNowAnalysisRun.Begin();
                (await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default)).Should().NotBeSameAs(parent);
                throw new InvalidOperationException("pipeline failed");
            };
            await nested.Should().ThrowAsync<InvalidOperationException>();
            (await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default)).Should().BeSameAs(parent);
        }
        await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()), Times.Exactly(5));
    }

    [Fact]
    public async Task Concurrent_readers_in_one_run_share_the_in_flight_load()
    {
        ScopeContext scope = CreateScope();
        Guid id = Guid.NewGuid();
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        TaskCompletionSource<AzureInventorySnapshotDetailReadModel?> response = new(TaskCreationOptions.RunContinuationsAsynchronously);
        repository.Setup(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>())).Returns(response.Task);
        using IDisposable run = SecureNowAnalysisRun.Begin();
        Task<SecureNowAnalysisSnapshot?> first = SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        Task<SecureNowAnalysisSnapshot?> second = SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        using CancellationTokenSource cancelled = new();
        Task<SecureNowAnalysisSnapshot?> waiting = SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, cancelled.Token);
        cancelled.Cancel();
        Func<Task> cancelledWait = async () => await waiting;
        await cancelledWait.Should().ThrowAsync<OperationCanceledException>();
        response.SetResult(new() { Header = new() { SnapshotId = id } });
        SecureNowAnalysisSnapshot?[] results = await Task.WhenAll(first, second);
        results[0].Should().BeSameAs(results[1]);
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Overlapping_independent_runs_do_not_share_evidence()
    {
        ScopeContext scope = CreateScope();
        Guid id = Guid.NewGuid();
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        TaskCompletionSource release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        async Task<SecureNowAnalysisSnapshot?> AnalyzeAsync()
        {
            using IDisposable run = SecureNowAnalysisRun.Begin();
            await release.Task;
            return await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        }
        Task<SecureNowAnalysisSnapshot?> first = AnalyzeAsync();
        Task<SecureNowAnalysisSnapshot?> second = AnalyzeAsync();
        release.SetResult();
        SecureNowAnalysisSnapshot?[] results = await Task.WhenAll(first, second);
        results[0].Should().NotBeSameAs(results[1]);
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Missing_snapshot_is_consistent_in_run_and_canonical_projection_bypasses_reuse()
    {
        ScopeContext scope = CreateScope();
        Guid id = Guid.NewGuid();
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        repository.Setup(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AzureInventorySnapshotDetailReadModel?)null);
        using IDisposable run = SecureNowAnalysisRun.Begin();
        (await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default)).Should().BeNull();
        (await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default)).Should().BeNull();
        await repository.Object.TryGetCanonicalSnapshotDetailAsync(scope, id);
        await repository.Object.TryGetCanonicalSnapshotDetailAsync(scope, id);
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()), Times.Once);
        repository.Verify(r => r.TryGetCanonicalSnapshotDetailAsync(scope, id, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Failed_and_cancelled_loads_can_retry_and_cancelled_cache_hits_still_cancel()
    {
        ScopeContext scope = CreateScope();
        Guid id = Guid.NewGuid();
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        repository.SetupSequence(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("transient"))
            .ThrowsAsync(new OperationCanceledException())
            .ReturnsAsync(new AzureInventorySnapshotDetailReadModel { Header = new() { SnapshotId = id } });
        using IDisposable run = SecureNowAnalysisRun.Begin();
        Func<Task> load = async () => await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        await load.Should().ThrowAsync<InvalidOperationException>();
        await load.Should().ThrowAsync<OperationCanceledException>();
        (await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default)).Should().NotBeNull();
        using CancellationTokenSource cancelled = new();
        cancelled.Cancel();
        Func<Task> cached = async () => await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, cancelled.Token);
        await cached.Should().ThrowAsync<OperationCanceledException>();
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()), Times.Exactly(3));
    }

    [Theory]
    [InlineData(SecurityDeclaredConnectionStatus.Revoked, false)]
    [InlineData(SecurityDeclaredConnectionStatus.Active, true)]
    public async Task Next_run_reloads_declared_connections_after_revocation_or_expiry(
        SecurityDeclaredConnectionStatus nextStatus, bool expired)
    {
        ScopeContext scope = CreateScope();
        Guid id = Guid.NewGuid();
        Guid from = Guid.NewGuid();
        Guid to = Guid.NewGuid();
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        repository.Setup(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotDetailReadModel
            {
                Header = new() { SnapshotId = id },
                Resources = [new() { CloudResourceId = from, AzureResourceId = "from" }, new() { CloudResourceId = to, AzureResourceId = "to" }],
            });
        List<SecurityDeclaredConnectionRecord> connections = [];
        SecurityDeclaredConnectionRecord Connection(SecurityDeclaredConnectionStatus status, DateTime expires) => new()
        {
            ConnectionId = Guid.NewGuid(), TenantId = scope.TenantId, FromCloudResourceId = from,
            ToCloudResourceId = to, Status = status, ExpirationUtc = expires,
        };
        connections.Add(Connection(SecurityDeclaredConnectionStatus.Active, DateTime.UtcNow.AddHours(1)));
        Mock<ISecurityDeclaredConnectionRepository> declared = new();
        declared.Setup(r => r.ListActiveByTenantAsync(scope.TenantId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => connections.ToArray());
        Mock<IOperatorInferredConnectionRepository> inferred = new();
        inferred.Setup(r => r.ListBySnapshotAsync(scope.TenantId, id, It.IsAny<CancellationToken>())).ReturnsAsync([]);
        DeclaredConnectionEnrichedAzureInventorySnapshotRepository enriched = new(repository.Object, declared.Object, inferred.Object);
        using (SecureNowAnalysisRun.Begin())
        {
            SecureNowAnalysisSnapshot? first = await SecureNowAnalysisRun.LoadAsync(enriched, scope, id, default);
            first!.Snapshot.Relationships.Should().ContainSingle();
            connections.Clear();
            connections.Add(Connection(nextStatus, expired ? DateTime.UtcNow.AddHours(-1) : DateTime.UtcNow.AddHours(1)));
            (await SecureNowAnalysisRun.LoadAsync(enriched, scope, id, default)).Should().BeSameAs(first);
        }
        using (SecureNowAnalysisRun.Begin())
            (await SecureNowAnalysisRun.LoadAsync(enriched, scope, id, default))!.Snapshot.Relationships.Should().BeEmpty();
        declared.Verify(r => r.ListActiveByTenantAsync(scope.TenantId, It.IsAny<DateTime>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        inferred.Verify(r => r.ListBySnapshotAsync(scope.TenantId, id, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public void Snapshot_owns_read_only_row_collections_and_preserves_index_comparison_and_order()
    {
        Guid cloudId = Guid.NewGuid();
        AzureInventoryResourceRecord resource = new() { ResourceRowId = Guid.NewGuid(), CloudResourceId = cloudId, AzureResourceId = "/subscriptions/S/resource/z", ResourceType = "first" };
        List<AzureInventoryResourceRecord> resources = [resource, new() { CloudResourceId = cloudId, AzureResourceId = "/subscriptions/S/resource/a", ResourceType = "second" }];
        List<AzureInventoryTagReadModel> tags = [new() { ResourceRowId = resource.ResourceRowId, TagKey = "environment", TagValue = "production" }];
        List<AzureInventoryResourcePropertyReadModel> properties = [new() { ResourceRowId = resource.ResourceRowId, PropertyKey = "x", PropertyValue = "y" }];
        SecureNowAnalysisSnapshot context = new(new() { Header = new(), Resources = resources, Tags = tags, Properties = properties });
        resources.Clear(); tags.Clear(); properties.Clear();
        context.Snapshot.Resources.Should().HaveCount(2);
        context.ResourcesByArmId[resource.AzureResourceId.ToUpperInvariant()].Should().BeSameAs(resource);
        context.ResourcesByArmId.Keys.Should().Equal(resource.AzureResourceId, "/subscriptions/S/resource/a");
        context.ResourceTypesByCloudResourceId[cloudId].Should().Be("first");
        context.TagsByResourceRowId[resource.ResourceRowId].Should().ContainSingle();
        context.PropertiesByResourceRowId[resource.ResourceRowId].Should().ContainSingle();
        Action mutateRows = () => ((IList<AzureInventoryResourceRecord>)context.Snapshot.Resources).Clear();
        Action mutateIndex = () => ((IDictionary<string, AzureInventoryResourceRecord>)context.ResourcesByArmId).Clear();
        mutateRows.Should().Throw<NotSupportedException>();
        mutateIndex.Should().Throw<NotSupportedException>();
    }
    [Fact]
    public async Task Different_snapshot_keys_load_concurrently_without_global_serialization()
    {
        ScopeContext scope = CreateScope();
        Guid firstId = Guid.NewGuid(), secondId = Guid.NewGuid();
        TaskCompletionSource<AzureInventorySnapshotDetailReadModel?> firstReply =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource<AzureInventorySnapshotDetailReadModel?> secondReply =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        repository.Setup(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns((ScopeContext _, Guid id, CancellationToken _) =>
                id == firstId ? firstReply.Task : secondReply.Task);

        using IDisposable run = SecureNowAnalysisRun.Begin();
        Task<SecureNowAnalysisSnapshot?> first = SecureNowAnalysisRun.LoadAsync(repository.Object, scope, firstId, default);
        Task<SecureNowAnalysisSnapshot?> second = SecureNowAnalysisRun.LoadAsync(repository.Object, scope, secondId, default);

        // Both repository calls must start before either one completes.
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), firstId, It.IsAny<CancellationToken>()), Times.Once);
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), secondId, It.IsAny<CancellationToken>()), Times.Once);
        secondReply.SetResult(new() { Header = new() { SnapshotId = secondId } });
        (await second)!.Snapshot.Header.SnapshotId.Should().Be(secondId);
        first.IsCompleted.Should().BeFalse();
        firstReply.SetResult(new() { Header = new() { SnapshotId = firstId } });
        (await first)!.Snapshot.Header.SnapshotId.Should().Be(firstId);
    }

    [Fact]
    public async Task Cancelling_the_first_waiter_does_not_cancel_the_shared_snapshot_load()
    {
        ScopeContext scope = CreateScope();
        Guid id = Guid.NewGuid();
        TaskCompletionSource<AzureInventorySnapshotDetailReadModel?> reply =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        repository.Setup(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()))
            .Returns(reply.Task);

        using IDisposable run = SecureNowAnalysisRun.Begin();
        using CancellationTokenSource firstCancel = new();
        Task<SecureNowAnalysisSnapshot?> first =
            SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, firstCancel.Token);
        Task<SecureNowAnalysisSnapshot?> second =
            SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        firstCancel.Cancel();

        Func<Task> cancelled = async () => await first;
        await cancelled.Should().ThrowAsync<OperationCanceledException>();
        reply.SetResult(new() { Header = new() { SnapshotId = id } });
        SecureNowAnalysisSnapshot? shared = await second;
        (await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default))
            .Should().BeSameAs(shared);
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Retained_snapshots_evict_least_recently_used_after_capacity()
    {
        ScopeContext scope = CreateScope();
        Guid[] ids = Enumerable.Range(0, SecureNowAnalysisRun.MaxRetainedSnapshots + 1)
            .Select(_ => Guid.NewGuid()).ToArray();
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();

        using IDisposable run = SecureNowAnalysisRun.Begin();
        SecureNowAnalysisSnapshot? first =
            await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, ids[0], default);
        foreach (Guid id in ids.Skip(1))
            (await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default))
                .Should().NotBeNull();

        SecureNowAnalysisSnapshot? reloaded =
            await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, ids[0], default);
        reloaded.Should().NotBeSameAs(first);
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), ids[0], It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Oversized_snapshot_is_returned_but_not_retained_in_the_run_cache()
    {
        ScopeContext scope = CreateScope();
        Guid id = Guid.NewGuid();
        AzureInventoryResourceRecord[] resources = Enumerable.Range(0, 17_000)
            .Select(i => new AzureInventoryResourceRecord { AzureResourceId = $"resource-{i}" })
            .ToArray();
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        repository.Setup(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AzureInventorySnapshotDetailReadModel
            {
                Header = new() { SnapshotId = id },
                Resources = resources,
            });

        using IDisposable run = SecureNowAnalysisRun.Begin();
        SecureNowAnalysisSnapshot? first =
            await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        SecureNowAnalysisSnapshot? second =
            await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        first!.Snapshot.Resources.Should().HaveCount(17_000);
        second.Should().NotBeSameAs(first);
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task In_flight_snapshot_reads_are_limited_to_four_per_run()
    {
        ScopeContext scope = CreateScope();
        Guid[] ids = Enumerable.Range(0, SecureNowAnalysisRun.MaxConcurrentSnapshotLoads + 1)
            .Select(_ => Guid.NewGuid()).ToArray();
        var replies = ids.ToDictionary(id => id, _ =>
            new TaskCompletionSource<AzureInventorySnapshotDetailReadModel?>(TaskCreationOptions.RunContinuationsAsynchronously));
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        repository.Setup(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns((ScopeContext _, Guid id, CancellationToken _) => replies[id].Task);

        using IDisposable run = SecureNowAnalysisRun.Begin();
        Task<SecureNowAnalysisSnapshot?>[] tasks = ids.Select(id =>
            SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default)).ToArray();
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), ids[4], It.IsAny<CancellationToken>()), Times.Never);
        replies[ids[0]].SetResult(new() { Header = new() { SnapshotId = ids[0] } });
        await tasks[0];
        // Slot release is asynchronous; allow the awaiting load to acquire it.
        await Task.Yield();
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), ids[4], It.IsAny<CancellationToken>()), Times.Once);
        foreach (Guid id in ids.Skip(1))
            replies[id].SetResult(new() { Header = new() { SnapshotId = id } });
        await Task.WhenAll(tasks);
    }

    [Fact]
    public async Task Disposing_a_run_cancels_pending_shared_reads_and_does_not_retain_them()
    {
        ScopeContext scope = CreateScope();
        Guid id = Guid.NewGuid();
        TaskCompletionSource<AzureInventorySnapshotDetailReadModel?> reply =
            new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IAzureInventorySnapshotRepository> repository = CreateRepository();
        repository.Setup(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()))
            .Returns(reply.Task);
        IDisposable run = SecureNowAnalysisRun.Begin();
        Task<SecureNowAnalysisSnapshot?> pending =
            SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default);
        run.Dispose();
        reply.SetResult(new() { Header = new() { SnapshotId = id } });
        Func<Task> cancelled = async () => await pending;
        await cancelled.Should().ThrowAsync<OperationCanceledException>();
        (await SecureNowAnalysisRun.LoadAsync(repository.Object, scope, id, default)).Should().NotBeNull();
        repository.Verify(r => r.TryGetSnapshotDetailAsync(It.IsAny<ScopeContext>(), id, It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

}
