using ArchLucid.Application.Evidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class EvidenceAddedIncrementalReReviewHostedServiceTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task ExecuteAsync_runs_enqueued_background_work(bool enqueueCanceledItem)
    {
        EvidenceAddedIncrementalReReviewQueue queue = new();
        using EvidenceAddedIncrementalReReviewHostedService sut = new(
            queue,
            NullLogger<EvidenceAddedIncrementalReReviewHostedService>.Instance);
        TaskCompletionSource invoked = new(TaskCreationOptions.RunContinuationsAsynchronously);

        await sut.StartAsync(CancellationToken.None);

        try
        {
            if (enqueueCanceledItem)
            {
                await queue.EnqueueAsync(
                    _ => Task.FromCanceled(new CancellationToken(canceled: true)),
                    CancellationToken.None);
            }

            await queue.EnqueueAsync(
                _ =>
                {
                    invoked.TrySetResult();

                    return Task.CompletedTask;
                },
                CancellationToken.None);

            await invoked.Task.WaitAsync(TimeSpan.FromSeconds(5));
        }
        finally
        {
            await sut.StopAsync(CancellationToken.None);
        }

        invoked.Task.IsCompletedSuccessfully.Should().BeTrue();
    }
}
