using ArchLucid.Core.OperationalErrors;
using ArchLucid.Host.Core.Hosted;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests.Audit;

[Trait("Category", "Unit")]
public sealed class OperationalErrorCaptureDrainHostedServiceTests
{
    [Fact]
    public async Task UnexpectedCancellationRetriesTheEventAndContinuesDraining()
    {
        InMemoryOperationalErrorCaptureQueue queue = new();
        Assert.True(queue.TryEnqueue(new OperationalErrorRecord()));
        TaskCompletionSource persisted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IOperationalErrorRepository> repository = new();
        int attempts = 0;
        repository.Setup(service => service.AppendAsync(It.IsAny<OperationalErrorRecord>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                if (Interlocked.Increment(ref attempts) == 1)
                    return Task.FromException(new OperationCanceledException("Storage timeout"));

                persisted.TrySetResult();
                return Task.CompletedTask;
            });

        ServiceCollection services = [];
        services.AddSingleton(repository.Object);
        await using ServiceProvider provider = services.BuildServiceProvider();
        using OperationalErrorCaptureDrainHostedService worker = new(
            queue,
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<OperationalErrorCaptureDrainHostedService>.Instance);
        await worker.StartAsync(CancellationToken.None);
        try
        {
            await persisted.Task.WaitAsync(TimeSpan.FromSeconds(10));
        }
        finally
        {
            await worker.StopAsync(CancellationToken.None);
        }

        Assert.Equal(2, attempts);
        Assert.Equal(0, queue.ApproximatePendingCount);
    }
}
