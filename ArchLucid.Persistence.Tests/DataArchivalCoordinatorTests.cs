using ArchLucid.Core.Conversation;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Conversation;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Repositories;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Collection(nameof(DataArchivalCoordinatorCollection))]
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DataArchivalCoordinatorTests
{
    [SkippableFact]
    public async Task RunOnceAsync_when_all_retention_non_positive_skips_archival_paths()
    {
        InMemoryRunRepository runs = new();
        InMemoryArchitectureDigestRepository digests = new();
        InMemoryConversationThreadRepository threads = new();
        DataArchivalCoordinator coordinator = new(
            runs,
            digests,
            threads,
            new InMemoryAgentExecutionTraceRepository(),
            NullLogger<DataArchivalCoordinator>.Instance);

        DateTime old = TimeProvider.System.UtcNowDateTime().AddDays(-400);
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "p",
                CreatedUtc = old
            },
            CancellationToken.None);

        DataArchivalOptions options = new()
        {
            RunsRetentionDays = 0,
            DigestsRetentionDays = 0,
            ConversationsRetentionDays = 0
        };

        await coordinator.RunOnceAsync(options, CancellationToken.None);

        IReadOnlyList<RunRecord> listed =
            await runs.ListByProjectAsync(scope, "p", 10, CancellationToken.None);
        listed.Should().ContainSingle();
        listed[0].ArchivedUtc.Should().BeNull();
    }

    [SkippableFact]
    public async Task RunOnceAsync_ArchivesRunsDigestsAndThreads_ByRetention()
    {
        InMemoryRunRepository runs = new();
        InMemoryArchitectureDigestRepository digests = new();
        InMemoryConversationThreadRepository threads = new();
        DataArchivalCoordinator coordinator = new(
            runs,
            digests,
            threads,
            new InMemoryAgentExecutionTraceRepository(),
            NullLogger<DataArchivalCoordinator>.Instance);

        DateTime old = TimeProvider.System.UtcNowDateTime().AddDays(-400);
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        };

        await runs.SaveAsync(
            new RunRecord
            {
                RunId = Guid.NewGuid(),
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ScopeProjectId = scope.ProjectId,
                ProjectId = "p",
                CreatedUtc = old
            },
            CancellationToken.None);

        ArchitectureDigest digest = new()
        {
            DigestId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            Title = "t",
            Summary = "s",
            ContentMarkdown = "# x",
            GeneratedUtc = old
        };

        await digests.CreateAsync(digest, CancellationToken.None);

        ConversationThread thread = new()
        {
            ThreadId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            LastUpdatedUtc = old
        };

        await threads.CreateAsync(thread, CancellationToken.None);

        DataArchivalOptions options = new()
        {
            RunsRetentionDays = 30,
            DigestsRetentionDays = 30,
            ConversationsRetentionDays = 30
        };

        await coordinator.RunOnceAsync(options, CancellationToken.None);

        IReadOnlyList<RunRecord> listed =
            await runs.ListByProjectAsync(scope, "p", 10, CancellationToken.None);
        listed.Should().BeEmpty();

        IReadOnlyList<ArchitectureDigest> digestList =
            await digests.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, 10,
                CancellationToken.None);
        digestList.Should().BeEmpty();

        IReadOnlyList<ConversationThread> threadList =
            await threads.ListByScopeAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, 10,
                CancellationToken.None);
        threadList.Should().BeEmpty();
    }

    [Fact]
    public async Task RunOnceAsync_hard_deletes_archived_traces_until_batch_returns_zero()
    {
        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.ArchiveRunsCreatedBeforeAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunArchiveBatchResult { UpdatedCount = 0, ArchivedRuns = [] });
        Mock<IArchitectureDigestRepository> digests = new();
        Mock<IConversationThreadRepository> threads = new();
        Mock<IAgentExecutionTraceRepository> traceRepo = new();
        traceRepo.SetupSequence(
                t => t.HardDeleteTracesArchivedBeforeAsync(
                    It.IsAny<DateTimeOffset>(),
                    500,
                    It.IsAny<CancellationToken>()))
            .ReturnsAsync(100)
            .ReturnsAsync(50)
            .ReturnsAsync(0);

        DataArchivalCoordinator coordinator = new(
            runs.Object,
            digests.Object,
            threads.Object,
            traceRepo.Object,
            NullLogger<DataArchivalCoordinator>.Instance);

        await coordinator.RunOnceAsync(
            new DataArchivalOptions
            {
                RunsRetentionDays = 0,
                DigestsRetentionDays = 0,
                ConversationsRetentionDays = 0,
                PurgeArchivedAgentExecutionTracesAfterDays = 30,
                PurgeArchivedAgentExecutionTracesBatchSize = 500
            },
            CancellationToken.None);

        traceRepo.Verify(
            t => t.HardDeleteTracesArchivedBeforeAsync(It.IsAny<DateTimeOffset>(), 500, It.IsAny<CancellationToken>()),
            Times.Exactly(3));
    }
}
