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
}
