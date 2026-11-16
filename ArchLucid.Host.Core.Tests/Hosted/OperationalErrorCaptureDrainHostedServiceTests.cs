using ArchLucid.Core.OperationalErrors;
using ArchLucid.Host.Core.Hosted;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class OperationalErrorCaptureDrainHostedServiceTests
{
    [Fact]
    public async Task Exhausted_append_attempts_requeue_the_record_until_persistence_succeeds()
    {
        using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(5));
        InMemoryOperationalErrorCaptureQueue queue = new(1);
        OperationalErrorRecord record = new();
        Assert.True(queue.TryEnqueue(record));

        int appendAttempts = 0;
        TaskCompletionSource saved = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IOperationalErrorRepository> repository = new(MockBehavior.Strict);
        repository.Setup(r => r.AppendAsync(
                It.Is<OperationalErrorRecord>(row => row.Id == record.Id),
                It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                if (++appendAttempts <= 3)
                    return Task.FromException(new InvalidOperationException("Temporary storage failure"));

                saved.SetResult();
                return Task.CompletedTask;
            });

        using ServiceProvider provider = new ServiceCollection().AddSingleton(repository.Object).BuildServiceProvider();
        using OperationalErrorCaptureDrainHostedService service = new(
            queue,
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<OperationalErrorCaptureDrainHostedService>.Instance);

        await service.StartAsync(timeout.Token);
        try
        {
            await saved.Task.WaitAsync(timeout.Token);
        }
        finally
        {
            await service.StopAsync(CancellationToken.None);
        }

        await service.ExecuteTask!;
        Assert.Equal(4, appendAttempts);
        Assert.Equal(0, queue.ApproximatePendingCount);
    }
}
