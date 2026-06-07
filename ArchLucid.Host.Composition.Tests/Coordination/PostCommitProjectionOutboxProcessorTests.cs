using ArchLucid.Application.Provenance;
using ArchLucid.Core.Audit;
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
}
