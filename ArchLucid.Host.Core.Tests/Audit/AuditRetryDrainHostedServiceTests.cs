using ArchLucid.Core.Audit;
using ArchLucid.Host.Core.Services;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests.Audit;

public sealed class AuditRetryDrainHostedServiceTests
{
    [Fact]
    public async Task UnexpectedCancellationRetriesTheEventAndContinuesDraining()
    {
        InMemoryAuditRetryQueue queue = new();
        Assert.True(queue.TryEnqueue(new AuditEvent()));
        TaskCompletionSource persisted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IAuditService> audit = new();
        int attempts = 0;
        audit.Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                if (Interlocked.Increment(ref attempts) == 1)
                    return Task.FromException(new OperationCanceledException("Storage timeout"));

                persisted.TrySetResult();
                return Task.CompletedTask;
            });

        ServiceCollection services = [];
        services.AddSingleton(audit.Object);
        await using ServiceProvider provider = services.BuildServiceProvider();
        using AuditRetryDrainHostedService worker = new(
            queue,
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<AuditRetryDrainHostedService>.Instance);
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
