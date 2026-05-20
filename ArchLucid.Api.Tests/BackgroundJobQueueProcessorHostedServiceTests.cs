using ArchLucid.Application.Jobs;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Jobs;

using Azure.Storage.Queues;
using Azure.Storage.Queues.Models;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Hosted;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class BackgroundJobQueueProcessorHostedServiceTests
{
    [Fact]
    public async Task ExecuteAsync_handles_shutdown_cancellation_token_gracefully()
    {
        Mock<QueueClient> queueClient = new();
        Mock<IBackgroundJobRepository> repo = new();
        Mock<IServiceScopeFactory> scopeFactory = new();

        var options = new BackgroundJobsOptions { ProcessorReceiveBatchSize = 1, ProcessorIdlePollMilliseconds = 10 };

        var sut = new BackgroundJobQueueProcessorHostedService(
            NullLogger<BackgroundJobQueueProcessorHostedService>.Instance,
            queueClient.Object,
            repo.Object,
            scopeFactory.Object,
            Options.Create(options));

        using var cts = new CancellationTokenSource();

        queueClient.Setup(q => q.CreateIfNotExistsAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Azure.Response>());

        queueClient.Setup(q => q.ReceiveMessagesAsync(It.IsAny<int>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .Returns<int, TimeSpan?, CancellationToken>((m, v, ct) =>
            {
                cts.Cancel(); // Simulate shutdown during the first pull
                throw new OperationCanceledException(ct);
            });

        Func<Task> act = async () => await sut.StartAsync(cts.Token);

        // Ensure it doesn't throw unhandled exception on graceful shutdown
        await act.Should().NotThrowAsync();

        // the background task should have finished
        await sut.StopAsync(CancellationToken.None);
    }

    [Fact]
    public async Task ProcessOneMessageAsync_skips_when_ShouldDeleteQueueMessageImmediately_is_true()
    {
        Mock<QueueClient> queueClient = new();
        Mock<IBackgroundJobRepository> repo = new();
        Mock<IServiceScopeFactory> scopeFactory = new();

        var options = new BackgroundJobsOptions { ProcessorReceiveBatchSize = 1 };

        var sut = new BackgroundJobQueueProcessorHostedService(
            NullLogger<BackgroundJobQueueProcessorHostedService>.Instance,
            queueClient.Object,
            repo.Object,
            scopeFactory.Object,
            Options.Create(options));

        using var cts = new CancellationTokenSource();
        int pulls = 0;

        queueClient.Setup(q => q.CreateIfNotExistsAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Azure.Response>());

        var queueMessage = QueuesModelFactory.QueueMessage("msg-id", "receipt", "job-1", 1);

        queueClient.Setup(q => q.ReceiveMessagesAsync(It.IsAny<int>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                pulls++;
                if (pulls == 1)
                    return Azure.Response.FromValue(new[] { queueMessage }, new Mock<Azure.Response>().Object);
                cts.Cancel();
                throw new OperationCanceledException(cts.Token);
            });

        repo.Setup(r => r.TryPrepareQueuedJobAsync("job-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueuedBackgroundJobPrepareResult(false, true, true, null));

        queueClient.Setup(q => q.DeleteMessageAsync("msg-id", "receipt", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Azure.Response>());

        await sut.StartAsync(CancellationToken.None);

        // Wait briefly for background execution
        await Task.Delay(100);

        queueClient.Verify(q => q.DeleteMessageAsync("msg-id", "receipt", It.IsAny<CancellationToken>()), Times.AtLeastOnce);

        await sut.StopAsync(CancellationToken.None);
    }

    [Fact]
    public async Task ExecuteAsync_uses_background_jobs_options_receive_batch_size_when_pulling_messages()
    {
        const int expectedBatchSize = 9;
        Mock<QueueClient> queueClient = new();
        Mock<IBackgroundJobRepository> repo = new();
        Mock<IServiceScopeFactory> scopeFactory = new();
        BackgroundJobsOptions backgroundJobsOptions = new()
        {
            ProcessorReceiveBatchSize = expectedBatchSize,
            ProcessorIdlePollMilliseconds = 10,
        };

        BackgroundJobQueueProcessorHostedService sut = new(
            NullLogger<BackgroundJobQueueProcessorHostedService>.Instance,
            queueClient.Object,
            repo.Object,
            scopeFactory.Object,
            Options.Create(backgroundJobsOptions));

        int capturedMaxMessages = 0;

        using CancellationTokenSource cts = new();

        queueClient.Setup(q => q.CreateIfNotExistsAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Azure.Response>());

        queueClient.Setup(q => q.ReceiveMessagesAsync(It.IsAny<int>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .Returns<int, TimeSpan?, CancellationToken>((maxMessages, _, ct) =>
            {
                capturedMaxMessages = maxMessages;
                cts.Cancel();

                throw new OperationCanceledException(ct);
            });

        await sut.StartAsync(cts.Token);

        for (int i = 0; i < 100 && capturedMaxMessages == 0; i++)
            await Task.Delay(20);

        capturedMaxMessages.Should().Be(expectedBatchSize);

        await sut.StopAsync(CancellationToken.None);
    }

    [Fact]
    public async Task ExecuteAsync_exits_cleanly_when_stopped_during_idle_poll_between_pulls()
    {
        Mock<QueueClient> queueClient = new();
        Mock<IBackgroundJobRepository> repo = new();
        Mock<IServiceScopeFactory> scopeFactory = new();
        BackgroundJobsOptions backgroundJobsOptions = new()
        {
            ProcessorReceiveBatchSize = 1,
            ProcessorIdlePollMilliseconds = 25,
        };

        BackgroundJobQueueProcessorHostedService sut = new(
            NullLogger<BackgroundJobQueueProcessorHostedService>.Instance,
            queueClient.Object,
            repo.Object,
            scopeFactory.Object,
            Options.Create(backgroundJobsOptions));

        queueClient.Setup(q => q.CreateIfNotExistsAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Azure.Response>());

        queueClient.Setup(q => q.ReceiveMessagesAsync(It.IsAny<int>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Azure.Response.FromValue(Array.Empty<QueueMessage>(), Mock.Of<Azure.Response>()));

        await sut.StartAsync(CancellationToken.None);

        await Task.Delay(80);

        Func<Task> stopHost = async () => await sut.StopAsync(CancellationToken.None);
        await stopHost.Should().NotThrowAsync();
    }

    [Fact]
    public async Task ProcessOneMessageAsync_marks_terminal_failure_when_work_unit_json_invalid()
    {
        Mock<QueueClient> queueClient = new();
        Mock<IBackgroundJobRepository> repo = new();
        Mock<IServiceScopeFactory> scopeFactory = new();

        BackgroundJobsOptions backgroundJobsOptions = new()
        {
            ProcessorReceiveBatchSize = 1,
            ProcessorIdlePollMilliseconds = 10
        };

        BackgroundJobQueueProcessorHostedService sut = new(
            NullLogger<BackgroundJobQueueProcessorHostedService>.Instance,
            queueClient.Object,
            repo.Object,
            scopeFactory.Object,
            Options.Create(backgroundJobsOptions));

        using CancellationTokenSource cts = new();
        int pulls = 0;
        QueueMessage queueMessage = QueuesModelFactory.QueueMessage("bad-json", "rcpt-bad", "job-bad", 1);

        queueClient.Setup(q => q.CreateIfNotExistsAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Azure.Response>());

        queueClient.Setup(q => q.ReceiveMessagesAsync(It.IsAny<int>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                pulls++;

                if (pulls == 1)
                {
                    return Azure.Response.FromValue(new[] { queueMessage }, Mock.Of<Azure.Response>());
                }

                cts.Cancel();

                throw new OperationCanceledException(cts.Token);
            });

        BackgroundJobRow row = new()
        {
            JobId = "job-bad",
            WorkUnitJson = "   ",
            RetryCount = 0,
            MaxRetries = 3,
            State = "Running",
        };

        repo.Setup(r => r.TryPrepareQueuedJobAsync("job-bad", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueuedBackgroundJobPrepareResult(true, false, false, row));

        queueClient.Setup(q => q.DeleteMessageAsync("bad-json", "rcpt-bad", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Azure.Response>());

        await sut.StartAsync(CancellationToken.None);
        await Task.Delay(150);

        repo.Verify(
            r => r.MarkFailedTerminalAsync("job-bad", "Invalid job payload.", 1, It.IsAny<CancellationToken>()),
            Times.Once);
        queueClient.Verify(q => q.DeleteMessageAsync("bad-json", "rcpt-bad", It.IsAny<CancellationToken>()), Times.AtLeastOnce);

        await sut.StopAsync(CancellationToken.None);
    }

    [Fact]
    public async Task ProcessOneMessageAsync_schedules_retry_when_executor_fails_within_max_retries()
    {
        Mock<QueueClient> queueClient = new();
        Mock<IBackgroundJobRepository> repo = new();
        Mock<IBackgroundJobWorkUnitExecutor> executor = new();
        executor
            .Setup(e => e.ExecuteAsync(It.IsAny<BackgroundJobWorkUnit>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("export failed"));

        ServiceCollection serviceCollection = new();
        serviceCollection.AddSingleton<IBackgroundJobWorkUnitExecutor>(executor.Object);
        serviceCollection.AddSingleton(Mock.Of<IBackgroundJobResultBlobAccessor>());
        using ServiceProvider provider = serviceCollection.BuildServiceProvider();
        IServiceScopeFactory scopeFactory = provider.GetRequiredService<IServiceScopeFactory>();

        BackgroundJobsOptions backgroundJobsOptions = new()
        {
            ProcessorReceiveBatchSize = 1,
            ProcessorIdlePollMilliseconds = 10
        };

        BackgroundJobQueueProcessorHostedService sut = new(
            NullLogger<BackgroundJobQueueProcessorHostedService>.Instance,
            queueClient.Object,
            repo.Object,
            scopeFactory,
            Options.Create(backgroundJobsOptions));

        string workJson = BackgroundJobWorkUnitJson.Serialize(
            new AnalysisReportDocxWorkUnit(
                new AnalysisReportDocxJobPayload { RunId = "run-retry", IncludeDiagram = false },
                "report.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"));

        BackgroundJobRow row = new()
        {
            JobId = "job-retry",
            WorkUnitJson = workJson,
            RetryCount = 0,
            MaxRetries = 2,
            State = "Running",
        };

        using CancellationTokenSource cts = new();
        int pulls = 0;
        QueueMessage queueMessage = QueuesModelFactory.QueueMessage("msg-retry", "rcpt-retry", "job-retry", 1);

        queueClient.Setup(q => q.CreateIfNotExistsAsync(It.IsAny<Dictionary<string, string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Azure.Response>());

        queueClient.Setup(q => q.ReceiveMessagesAsync(It.IsAny<int>(), It.IsAny<TimeSpan?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                pulls++;

                if (pulls == 1)
                {
                    return Azure.Response.FromValue(new[] { queueMessage }, Mock.Of<Azure.Response>());
                }

                cts.Cancel();

                throw new OperationCanceledException(cts.Token);
            });

        repo.Setup(r => r.TryPrepareQueuedJobAsync("job-retry", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new QueuedBackgroundJobPrepareResult(true, false, false, row));
        repo.Setup(r => r.CountNonTerminalAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        repo.Setup(r => r.MarkPendingRetryAsync("job-retry", 1, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        queueClient.Setup(q => q.SendMessageAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Azure.Response<SendReceipt>>());

        queueClient.Setup(q => q.DeleteMessageAsync("msg-retry", "rcpt-retry", It.IsAny<CancellationToken>()))
            .ReturnsAsync(Mock.Of<Azure.Response>());

        await sut.StartAsync(CancellationToken.None);
        await Task.Delay(1500);

        repo.Verify(
            r => r.MarkPendingRetryAsync("job-retry", 1, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
        queueClient.Verify(q => q.SendMessageAsync("job-retry", It.IsAny<CancellationToken>()), Times.Once);

        await sut.StopAsync(CancellationToken.None);
    }
}
