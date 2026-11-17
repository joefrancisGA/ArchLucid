using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Runs.Async.Workers;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Async;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunAsyncOperationQueueDrainWorkerTests
{
    [Fact]
    public async Task DrainAsync_leaves_backlog_in_channel_until_dispatch_capacity_frees()
    {
        const int queuedCount = 128;
        ArchitectureRunAsyncOperationQueue queue = new();
        ArchitectureRunAsyncOperationQueueDrainWorker worker = new(queue);
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        for (int i = 0; i < queuedCount; i++)
        {
            await queue.EnqueueAsync(new ArchitectureRunAsyncOperationWorkItem(
                ArchitectureRunAsyncOperationKind.Execute, scope, "actor", "correlation", Guid.NewGuid().ToString("N"),
                null, false, null, null));
        }

        using CancellationTokenSource stop = new();
        TaskCompletionSource release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource allDispatched = new(TaskCreationOptions.RunContinuationsAsynchronously);
        int dispatched = 0;
        Task drain = worker.DrainAsync((_, _) =>
        {
            if (++dispatched == queuedCount)
                allDispatched.TrySetResult();

            return release.Task;
        }, stop.Token);

        try
        {
            dispatched.Should().BeInRange(1, queuedCount - 1);
            release.TrySetResult();
            await allDispatched.Task.WaitAsync(TimeSpan.FromSeconds(5));
        }
        finally
        {
            release.TrySetResult();
            stop.Cancel();
            await drain.WaitAsync(TimeSpan.FromSeconds(5));
        }
    }
}
