using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Coordination;

internal static class RetrievalOutboxRetryAssertions
{
    internal static async Task VerifyAsync(
        IRetrievalIndexingOutboxRepository sut, DateTime due, Func<Guid, Task> makeRetryDue,
        Func<Guid, Guid, Task>? prepareRuns = null)
    {
        Guid tenant = Guid.NewGuid();
        Guid workspace = Guid.NewGuid();
        Guid project = Guid.NewGuid();
        Guid firstRun = Guid.NewGuid();
        Guid nextRun = Guid.NewGuid();
        if (prepareRuns is not null)
            await prepareRuns(firstRun, nextRun);

        await sut.EnqueueAsync(firstRun, tenant, workspace, project, CancellationToken.None);
        RetrievalIndexingOutboxEntry first =
            (await sut.DequeuePendingAsync(1, 300, CancellationToken.None)).Should().ContainSingle().Subject;
        await sut.RecordBackoffAfterProcessingFailureAsync(first.OutboxId, due, "transient", CancellationToken.None);

        await sut.EnqueueAsync(nextRun, tenant, workspace, project, CancellationToken.None);
        IReadOnlyList<RetrievalIndexingOutboxEntry>[] beforeDue =
            await RetryTestStartGate.RunTogetherAsync(4, (_, ct) => sut.DequeuePendingAsync(1, 300, ct));
        RetrievalIndexingOutboxEntry next = beforeDue.SelectMany(batch => batch).Should().ContainSingle().Subject;
        next.RunId.Should().Be(nextRun);
        next.OutboxId.Should().NotBe(first.OutboxId);
        await sut.MarkProcessedAsync(next.OutboxId, CancellationToken.None);

        await makeRetryDue(first.OutboxId);
        IReadOnlyList<RetrievalIndexingOutboxEntry>[] atDue =
            await RetryTestStartGate.RunTogetherAsync(4, (_, ct) => sut.DequeuePendingAsync(1, 300, ct));
        RetrievalIndexingOutboxEntry retry = atDue.SelectMany(batch => batch).Should().ContainSingle().Subject;
        retry.RunId.Should().Be(firstRun);
        retry.OutboxId.Should().Be(first.OutboxId);
        retry.AttemptCount.Should().Be(1);
        await sut.MarkProcessedAsync(retry.OutboxId, CancellationToken.None);
        await sut.MarkProcessedAsync(retry.OutboxId, CancellationToken.None);
        (await sut.CountPendingAsync(CancellationToken.None)).Should().Be(0);
    }
}
