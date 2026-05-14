using ArchLucid.Application.Jobs;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;

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
                if (pulls == 1) return Azure.Response.FromValue(new[] { queueMessage }, new Mock<Azure.Response>().Object);
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
}
