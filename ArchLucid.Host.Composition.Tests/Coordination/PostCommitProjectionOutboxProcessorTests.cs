using System.Diagnostics;

using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Projection;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Orchestration;
using ArchLucid.Persistence.Queries;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

[Trait("Suite", "Core")]
public sealed class PostCommitProjectionOutboxProcessorTests
{
    [Fact]
    public async Task ProcessPendingBatchAsync_marks_processed_when_run_detail_no_longer_found()
    {
        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };
        Mock<IPostCommitProjectionOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PostCommitProjectionOutboxEntry
                {
                    OutboxId = outboxId,
                    WorkType = PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization,
                    RunId = runId,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);
        outbox.Setup(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(q => q.GetRunDetailAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => authorityQuery.Object);
        services.AddScoped(_ => Mock.Of<IProvenanceGraphAccessService>());
        services.AddScoped(_ => Mock.Of<IAuditService>());
        ServiceProvider provider = services.BuildServiceProvider();

        PostCommitProjectionOutboxProcessor sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new PostCommitProjectionOutboxProcessorOptions()),
            TimeProvider.System,
            NullLogger<PostCommitProjectionOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_sets_tenant_workspace_activity_tags()
    {
        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        List<Activity> stopped = [];

        using ActivityListener listener = new();
        listener.ShouldListenTo = s => s.Name == ArchLucidMeterNames.AuthorityRunActivitySource;
        listener.Sample = (ref _) => ActivitySamplingResult.AllDataAndRecorded;
        listener.ActivityStopped = stopped.Add;
        ActivitySource.AddActivityListener(listener);

        Mock<IPostCommitProjectionOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PostCommitProjectionOutboxEntry
                {
                    OutboxId = outboxId,
                    WorkType = PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);
        outbox.Setup(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(q => q.GetRunDetailAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => authorityQuery.Object);
        services.AddScoped(_ => Mock.Of<IProvenanceGraphAccessService>());
        services.AddScoped(_ => Mock.Of<IAuditService>());
        ServiceProvider provider = services.BuildServiceProvider();

        PostCommitProjectionOutboxProcessor sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new PostCommitProjectionOutboxProcessorOptions()),
            TimeProvider.System,
            NullLogger<PostCommitProjectionOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        stopped.Should().ContainSingle();
        stopped[0].GetTagItem(ActivityScopeTags.TenantIdTag).Should().Be(tenantId.ToString("D"));
        stopped[0].GetTagItem(ActivityScopeTags.WorkspaceIdTag).Should().Be(workspaceId.ToString("D"));
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_dead_letters_on_unknown_work_type()
    {
        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Mock<IPostCommitProjectionOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PostCommitProjectionOutboxEntry
                {
                    OutboxId = outboxId,
                    WorkType = "UnknownWorkType",
                    RunId = runId,
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                    AttemptCount = 47
                }
            ]);
        outbox
            .Setup(o => o.RecordDeadLetterAsync(outboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuditService> audit = new();
        audit
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => audit.Object);
        ServiceProvider provider = services.BuildServiceProvider();

        PostCommitProjectionOutboxProcessorOptions options = new() { MaxAttemptsBeforeDeadLetter = 48 };
        PostCommitProjectionOutboxProcessor sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(options),
            TimeProvider.System,
            NullLogger<PostCommitProjectionOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(
            o => o.RecordDeadLetterAsync(outboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            a => a.LogAsync(
                It.Is<AuditEvent>(e => e.EventType == AuditEventTypes.PostCommitProjectionDeadLettered && e.RunId == runId),
                It.IsAny<CancellationToken>()),
            Times.Once);
        outbox.Verify(o => o.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_creates_isolated_scope_per_dequeued_entry()
    {
        Guid runId = Guid.NewGuid();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        List<PostCommitProjectionOutboxEntry> entries =
        [
            new()
            {
                OutboxId = Guid.NewGuid(),
                WorkType = PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization,
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            },
            new()
            {
                OutboxId = Guid.NewGuid(),
                WorkType = PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization,
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            },
            new()
            {
                OutboxId = Guid.NewGuid(),
                WorkType = PostCommitProjectionWorkTypes.ProvenanceSnapshotMaterialization,
                RunId = runId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime()
            },
        ];

        Mock<IPostCommitProjectionOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(entries);
        outbox
            .Setup(o => o.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IAuthorityQueryService> authorityQuery = new();
        authorityQuery
            .Setup(q => q.GetRunDetailAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => authorityQuery.Object);
        services.AddScoped(_ => Mock.Of<IProvenanceGraphAccessService>());
        services.AddScoped(_ => Mock.Of<IAuditService>());
        ServiceProvider provider = services.BuildServiceProvider();

        int scopeCreates = 0;
        Mock<IServiceScopeFactory> scopeFactory = new();
        scopeFactory.Setup(f => f.CreateScope()).Returns(() =>
        {
            Interlocked.Increment(ref scopeCreates);
            Mock<IServiceScope> entryScope = new();
            entryScope.Setup(s => s.ServiceProvider).Returns(provider);
            entryScope.Setup(s => s.Dispose());
            return entryScope.Object;
        });

        PostCommitProjectionOutboxProcessor sut = new(
            scopeFactory.Object,
            Options.Create(new PostCommitProjectionOutboxProcessorOptions { MaxConcurrentBatchEntries = 3 }),
            TimeProvider.System,
            NullLogger<PostCommitProjectionOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        scopeCreates.Should().BeGreaterThanOrEqualTo(entries.Count + 1);
        outbox.Verify(o => o.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Exactly(entries.Count));
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_invokes_decision_node_materializer()
    {
        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Mock<IPostCommitProjectionOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PostCommitProjectionOutboxEntry
                {
                    OutboxId = outboxId,
                    WorkType = PostCommitProjectionWorkTypes.DecisionEngineV2NodeMaterialization,
                    RunId = runId,
                    TenantId = Guid.NewGuid(),
                    WorkspaceId = Guid.NewGuid(),
                    ProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);
        outbox.Setup(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IDecisionEngineV2NodeMaterializer> materializer = new();
        materializer
            .Setup(m => m.MaterializeIfMissingAsync(runId.ToString("N"), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => materializer.Object);
        services.AddScoped(_ => Mock.Of<IAuditService>());
        ServiceProvider provider = services.BuildServiceProvider();

        PostCommitProjectionOutboxProcessor sut = new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new PostCommitProjectionOutboxProcessorOptions()),
            TimeProvider.System,
            NullLogger<PostCommitProjectionOutboxProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        materializer.Verify(
            m => m.MaterializeIfMissingAsync(runId.ToString("N"), It.IsAny<CancellationToken>()),
            Times.Once);
        outbox.Verify(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
