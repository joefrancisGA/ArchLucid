using System.Collections.Concurrent;
using System.Reflection;

using ArchLucid.Application.Jobs;
using ArchLucid.Host.Core.Jobs;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for in-memory background job queue (payload executor + channel semantics).
/// </summary>
[Trait("Category", "Unit")]
public sealed class InMemoryBackgroundJobQueueTests
{
    private static BackgroundJobFile OkFile()
    {
        return new BackgroundJobFile("out.bin", "application/octet-stream", []);
    }

    private static AnalysisReportDocxWorkUnit Work(string label)
    {
        return new AnalysisReportDocxWorkUnit(new AnalysisReportDocxJobPayload { RunId = label }, $"{label}.bin",
            "application/octet-stream");
    }

    private static InMemoryBackgroundJobQueue CreateSystem(
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger,
        Action<Mock<IBackgroundJobWorkUnitExecutor>>? configureExecutor = null)
    {
        Mock<IBackgroundJobWorkUnitExecutor> executor = new();
        configureExecutor?.Invoke(executor);

        ServiceCollection services = [];
        services.AddLogging();
        services.AddScoped<IBackgroundJobWorkUnitExecutor>(_ => executor.Object);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        return new InMemoryBackgroundJobQueue(logger.Object, scopeFactory);
    }

    [SkippableFact]
    public async Task Enqueue_WhenPendingChannelIsFull_ThrowsInvalidOperationException()
    {
        TaskCompletionSource<bool> barrier = new();
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();

        InMemoryBackgroundJobQueue queue = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .Returns<BackgroundJobWorkUnit, CancellationToken>(async (_, ct) =>
                {
                    await barrier.Task.WaitAsync(ct);

                    return OkFile();
                }));

        await queue.StartAsync(CancellationToken.None);

        _ = await queue.EnqueueAsync(Work("block"));

        await Task.Delay(100, CancellationToken.None);

        for (int i = 0; i < InMemoryBackgroundJobQueueLimits.MaxPendingJobs; i++)
            _ = await queue.EnqueueAsync(Work($"p{i}"));

        Func<Task> overflow = async () => _ = await queue.EnqueueAsync(Work("overflow"));

        await overflow.Should().ThrowAsync<InvalidOperationException>().WithMessage("*capacity*");

        barrier.SetResult(true);

        await Task.Delay(300, CancellationToken.None);
        await queue.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task ExecuteAsync_WhenWorkThrows_MarksJobFailedWithErrorMessage()
    {
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();

        InMemoryBackgroundJobQueue queue = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("work failed")));

        await queue.StartAsync(CancellationToken.None);

        string jobId = await queue.EnqueueAsync(Work("bad"));

        await WaitForTerminalStateAsync(queue, jobId, TimeSpan.FromSeconds(5));

        BackgroundJobInfo? info = await queue.GetInfoAsync(jobId);
        info.Should().NotBeNull();
        info.State.Should().Be(BackgroundJobState.Failed);
        info.Error.Should().Contain("work failed");

        await queue.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task EvictOldTerminalJobs_AfterMoreThan200Succeeded_OldestJobRemoved()
    {
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();

        InMemoryBackgroundJobQueue queue = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .Returns(async (BackgroundJobWorkUnit _, CancellationToken ct) =>
                {
                    await Task.Delay(15, ct);

                    return OkFile();
                }));

        await queue.StartAsync(CancellationToken.None);

        List<string> ids = [];
        for (int i = 0; i < InMemoryBackgroundJobQueueLimits.MaxRetainedTerminalJobs + 1; i++)
        {
            string id = await queue.EnqueueAsync(Work($"ok{i}"));
            ids.Add(id);
        }

        await WaitForTerminalStateAsync(queue, ids[^1], TimeSpan.FromSeconds(120));

        (await queue.GetInfoAsync(ids[0])).Should().BeNull(
            $"oldest terminal job should be evicted after {InMemoryBackgroundJobQueueLimits.MaxRetainedTerminalJobs + 1} completions");

        await queue.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task Enqueue_WithRetry_RetriesOnFailureThenSucceeds()
    {
        int attempt = 0;
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();

        InMemoryBackgroundJobQueue queue = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .Returns(() =>
                {
                    attempt++;

                    return attempt < 3
                        ? Task.FromException<BackgroundJobFile>(
                            new InvalidOperationException($"Transient failure #{attempt}"))
                        : Task.FromResult(OkFile());
                }));

        await queue.StartAsync(CancellationToken.None);

        string jobId = await queue.EnqueueAsync(Work("retry-ok"), 3);

        await WaitForTerminalStateAsync(queue, jobId, TimeSpan.FromSeconds(30));

        BackgroundJobInfo? info = await queue.GetInfoAsync(jobId);
        info.Should().NotBeNull();
        info.State.Should().Be(BackgroundJobState.Succeeded);
        info.RetryCount.Should().Be(2, "two retries should have occurred before success");

        await queue.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task Enqueue_WithRetry_ExhaustsRetriesThenFails()
    {
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();

        InMemoryBackgroundJobQueue queue = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("Always fails")));

        await queue.StartAsync(CancellationToken.None);

        string jobId = await queue.EnqueueAsync(Work("retry-fail"), 2);

        await WaitForTerminalStateAsync(queue, jobId, TimeSpan.FromSeconds(30));

        BackgroundJobInfo? info = await queue.GetInfoAsync(jobId);
        info.Should().NotBeNull();
        info.State.Should().Be(BackgroundJobState.Failed);
        info.RetryCount.Should().Be(3, "initial attempt + 2 retries = 3 total attempts");
        info.Error.Should().Contain("Always fails");

        await queue.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task MarkCanceledAsync_while_pending_prevents_execution_when_dequeued()
    {
        TaskCompletionSource<bool> firstJobBarrier = new();
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();
        int executeCount = 0;

        InMemoryBackgroundJobQueue queue = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .Returns<BackgroundJobWorkUnit, CancellationToken>(async (_, ct) =>
                {
                    executeCount++;

                    if (executeCount == 1)
                        await firstJobBarrier.Task.WaitAsync(ct);

                    return OkFile();
                }));

        await queue.StartAsync(CancellationToken.None);

        string blockingJobId = await queue.EnqueueAsync(Work("blocker"));
        await Task.Delay(50, CancellationToken.None);

        string canceledJobId = await queue.EnqueueAsync(Work("canceled"));

        await queue.MarkCanceledAsync(canceledJobId, CancellationToken.None);

        BackgroundJobInfo? canceledBeforeRelease = await queue.GetInfoAsync(canceledJobId);
        canceledBeforeRelease.Should().NotBeNull();
        canceledBeforeRelease!.State.Should().Be(BackgroundJobState.Canceled);

        firstJobBarrier.SetResult(true);

        await Task.Delay(300, CancellationToken.None);

        BackgroundJobInfo? canceledAfterDrain = await queue.GetInfoAsync(canceledJobId);
        canceledAfterDrain.Should().NotBeNull();
        canceledAfterDrain!.State.Should().Be(BackgroundJobState.Canceled);
        executeCount.Should().Be(1, "only the blocking job should have executed");

        await queue.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task MarkCanceled_while_running_does_not_overwrite_with_succeeded()
    {
        TaskCompletionSource<bool> started = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource<bool> release = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();

        InMemoryBackgroundJobQueue queue = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .Returns(async (BackgroundJobWorkUnit _, CancellationToken ct) =>
                {
                    started.TrySetResult(true);
                    await release.Task.WaitAsync(ct);

                    return OkFile();
                }));

        await queue.StartAsync(CancellationToken.None);

        string jobId = await queue.EnqueueAsync(Work("cancel-while-running"));
        await started.Task.WaitAsync(TimeSpan.FromSeconds(5));

        await queue.MarkCanceledAsync(jobId);
        release.TrySetResult(true);

        await Task.Delay(300, CancellationToken.None);

        BackgroundJobInfo? info = await queue.GetInfoAsync(jobId);
        info.Should().NotBeNull();
        info!.State.Should().Be(BackgroundJobState.Canceled, "cancel must win over a late success");

        await queue.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task Enqueue_WithZeroRetries_FailsImmediately()
    {
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();

        InMemoryBackgroundJobQueue queue = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("Immediate fail")));

        await queue.StartAsync(CancellationToken.None);

        string jobId = await queue.EnqueueAsync(Work("no-retry"));

        await WaitForTerminalStateAsync(queue, jobId, TimeSpan.FromSeconds(5));

        BackgroundJobInfo? info = await queue.GetInfoAsync(jobId);
        info.Should().NotBeNull();
        info.State.Should().Be(BackgroundJobState.Failed);
        info.RetryCount.Should().Be(1, "one attempt, no retries");

        await queue.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task MarkCanceled_during_terminal_failure_does_not_overwrite_with_failed_after_second_state_read()
    {
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();
        InMemoryBackgroundJobQueue? queueRef = null;
        string? jobIdRef = null;

        logger
            .Setup(x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((value, _) => value.ToString()!.Contains("moving to DLQ", StringComparison.Ordinal)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
            .Callback(() =>
            {
                if (queueRef is not null && jobIdRef is not null)
                    _ = queueRef.MarkCanceledAsync(jobIdRef);
            });

        queueRef = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("terminal failure")));

        await queueRef.StartAsync(CancellationToken.None);

        jobIdRef = await queueRef.EnqueueAsync(Work("terminal-cancel-reread"), maxRetries: 0);

        await WaitForAnyTerminalStateAsync(queueRef, jobIdRef, TimeSpan.FromSeconds(5));

        BackgroundJobInfo? info = await queueRef.GetInfoAsync(jobIdRef);
        info.Should().NotBeNull();
        info!.State.Should().Be(BackgroundJobState.Canceled, "cancel must win over terminal failure assignment");

        await queueRef.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task MarkCanceled_during_retry_capacity_exhausted_does_not_overwrite_with_failed_after_second_state_read()
    {
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();
        InMemoryBackgroundJobQueue? queueRef = null;
        string? jobIdRef = null;

        logger
            .Setup(x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((value, _) => value.ToString()!.Contains("pending capacity exhausted", StringComparison.Ordinal)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
            .Callback(() =>
            {
                if (queueRef is not null && jobIdRef is not null)
                    _ = queueRef.MarkCanceledAsync(jobIdRef);
            });

        queueRef = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("retry capacity failure")));

        await queueRef.StartAsync(CancellationToken.None);

        jobIdRef = await queueRef.EnqueueAsync(Work("retry-capacity"), maxRetries: 2);

        await Task.Delay(150, CancellationToken.None);

        for (int i = 0; i < InMemoryBackgroundJobQueueLimits.MaxPendingJobs; i++)
            _ = await queueRef.EnqueueAsync(Work($"fill-{i}"));

        await WaitForAnyTerminalStateAsync(queueRef, jobIdRef, TimeSpan.FromSeconds(15));

        BackgroundJobInfo? info = await queueRef.GetInfoAsync(jobIdRef);
        info.Should().NotBeNull();
        info!.State.Should().Be(BackgroundJobState.Canceled, "cancel must win over capacity-exhausted failure assignment");

        await queueRef.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task MarkCanceled_spam_during_failing_job_with_retries_never_surfaces_running_after_canceled()
    {
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();
        InMemoryBackgroundJobQueue? queueRef = null;

        queueRef = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .Returns<BackgroundJobWorkUnit, CancellationToken>(async (_, ct) =>
                {
                    await Task.Delay(5, ct);

                    throw new InvalidOperationException("retry spam failure");
                }));

        await queueRef.StartAsync(CancellationToken.None);

        string jobId = await queueRef.EnqueueAsync(Work("cancel-tryassign-spam"), maxRetries: 3);

        bool sawCanceled = false;

        Task cancelSpam = Task.Run(async () =>
        {
            for (int attempt = 0; attempt < 800; attempt++)
            {
                await queueRef!.MarkCanceledAsync(jobId);
                await Task.Delay(0, CancellationToken.None);

                BackgroundJobInfo? snapshot = await queueRef.GetInfoAsync(jobId);

                if (snapshot?.State == BackgroundJobState.Canceled)
                    sawCanceled = true;

                if (sawCanceled && snapshot?.State == BackgroundJobState.Running)
                    throw new InvalidOperationException("Running observed after Canceled was visible.");
            }
        });

        await Task.WhenAny(cancelSpam, WaitForAnyTerminalStateAsync(queueRef, jobId, TimeSpan.FromSeconds(12)));

        await cancelSpam;

        BackgroundJobInfo? info = await queueRef.GetInfoAsync(jobId);
        info.Should().NotBeNull();
        info!.State.Should().Be(BackgroundJobState.Canceled);

        await queueRef.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task MarkCanceled_during_dequeue_does_not_overwrite_with_running()
    {
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();
        InMemoryBackgroundJobQueue? queueRef = null;

        queueRef = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .Returns<BackgroundJobWorkUnit, CancellationToken>(async (_, ct) =>
                {
                    await Task.Delay(25, ct);

                    throw new InvalidOperationException("dequeue race failure");
                }));

        await queueRef.StartAsync(CancellationToken.None);

        string jobId = await queueRef.EnqueueAsync(Work("dequeue-cancel-race"), maxRetries: 2);

        Task cancelSpam = Task.Run(async () =>
        {
            for (int attempt = 0; attempt < 400; attempt++)
            {
                await queueRef!.MarkCanceledAsync(jobId);
                await Task.Delay(0, CancellationToken.None);
            }
        });

        await Task.WhenAny(cancelSpam, WaitForAnyTerminalStateAsync(queueRef, jobId, TimeSpan.FromSeconds(10)));

        BackgroundJobInfo? info = await queueRef.GetInfoAsync(jobId);
        info.Should().NotBeNull();
        info!.State.Should().Be(BackgroundJobState.Canceled, "cancel must win over Running assignment during dequeue");

        await queueRef.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task MarkCanceled_during_terminal_failure_log_blocked_before_return_does_not_assign_failed()
    {
        TaskCompletionSource<bool> releaseLog = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();
        InMemoryBackgroundJobQueue? queueRef = null;
        string? jobIdRef = null;

        logger
            .Setup(x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((value, _) => value.ToString()!.Contains("moving to DLQ", StringComparison.Ordinal)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
            .Callback(() =>
            {
                releaseLog.Task.Wait(TimeSpan.FromSeconds(5));
            });

        queueRef = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("terminal failure")));

        await queueRef.StartAsync(CancellationToken.None);

        jobIdRef = await queueRef.EnqueueAsync(Work("terminal-cancel-blocked-log"), maxRetries: 0);

        await Task.Delay(200, CancellationToken.None);

        await queueRef.MarkCanceledAsync(jobIdRef!);
        releaseLog.TrySetResult(true);

        await WaitForAnyTerminalStateAsync(queueRef, jobIdRef!, TimeSpan.FromSeconds(5));

        BackgroundJobInfo? info = await queueRef.GetInfoAsync(jobIdRef!);
        info.Should().NotBeNull();
        info!.State.Should().Be(BackgroundJobState.Canceled, "cancel before DLQ log returns must block terminal Failed assignment");

        await queueRef.StopAsync(CancellationToken.None);
    }

    [SkippableFact]
    public async Task MarkCanceled_during_retry_scheduling_does_not_overwrite_with_pending()
    {
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();
        InMemoryBackgroundJobQueue? queueRef = null;
        string? jobIdRef = null;

        logger
            .Setup(x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((value, _) => value.ToString()!.Contains("scheduling retry", StringComparison.Ordinal)),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()))
            .Callback(() =>
            {
                if (queueRef is not null && jobIdRef is not null)
                    _ = queueRef.MarkCanceledAsync(jobIdRef);
            });

        queueRef = CreateSystem(
            logger,
            m => m.Setup(x => x.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("retry failure")));

        await queueRef.StartAsync(CancellationToken.None);

        jobIdRef = await queueRef.EnqueueAsync(Work("retry-cancel-reread"), maxRetries: 2);

        await WaitForAnyTerminalStateAsync(queueRef, jobIdRef, TimeSpan.FromSeconds(5));

        BackgroundJobInfo? info = await queueRef.GetInfoAsync(jobIdRef);
        info.Should().NotBeNull();
        info!.State.Should().Be(BackgroundJobState.Canceled, "cancel must win over pending retry assignment");

        await queueRef.StopAsync(CancellationToken.None);
    }

    private static async Task WaitForTerminalStateAsync(InMemoryBackgroundJobQueue queue, string jobId,
        TimeSpan timeout)
    {
        DateTime deadline = TimeProvider.System.UtcNowDateTime() + timeout;
        while (TimeProvider.System.UtcNowDateTime() < deadline)
        {
            BackgroundJobInfo? info = await queue.GetInfoAsync(jobId);
            if (info is { State: BackgroundJobState.Succeeded or BackgroundJobState.Failed })
                return;

            await Task.Delay(20);
        }

        throw new TimeoutException($"Job {jobId} did not reach a terminal state within {timeout}.");
    }

    private static async Task WaitForAnyTerminalStateAsync(InMemoryBackgroundJobQueue queue, string jobId,
        TimeSpan timeout)
    {
        DateTime deadline = TimeProvider.System.UtcNowDateTime() + timeout;
        while (TimeProvider.System.UtcNowDateTime() < deadline)
        {
            BackgroundJobInfo? info = await queue.GetInfoAsync(jobId);
            if (info is
                {
                    State: BackgroundJobState.Succeeded
                    or BackgroundJobState.Failed
                    or BackgroundJobState.Canceled
                })
                return;

            await Task.Delay(20);
        }

        throw new TimeoutException($"Job {jobId} did not reach a terminal state within {timeout}.");
    }

    [SkippableFact]
    public async Task EnqueueAsync_when_cancellation_requested_does_not_leave_orphan_pending_job()
    {
        using CancellationTokenSource cts = new();
        cts.Cancel();
        Mock<ILogger<InMemoryBackgroundJobQueue>> logger = new();
        InMemoryBackgroundJobQueue queue = CreateSystem(logger);

        Func<Task> act = async () => _ = await queue.EnqueueAsync(Work("canceled-enqueue"), cancellationToken: cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();

        ConcurrentDictionary<string, BackgroundJobInfo> info = ReadInMemoryJobInfoDictionary(queue);
        info.Should().BeEmpty("canceled enqueue must not leave a Pending row without a channel item");
    }

    private static ConcurrentDictionary<string, BackgroundJobInfo> ReadInMemoryJobInfoDictionary(
        InMemoryBackgroundJobQueue queue)
    {
        FieldInfo? field = typeof(InMemoryBackgroundJobQueue).GetField(
            "_info",
            BindingFlags.Instance | BindingFlags.NonPublic);

        field.Should().NotBeNull();

        return (ConcurrentDictionary<string, BackgroundJobInfo>)field!.GetValue(queue)!;
    }
}
