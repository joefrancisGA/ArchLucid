using ArchLucid.Application.Evidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class EvidenceAddedIncrementalReReviewHostedServiceTests
{
    [Fact]
    public async Task ExecuteAsync_runs_enqueued_background_work()
    {
        EvidenceAddedIncrementalReReviewQueue queue = new();
        using EvidenceAddedIncrementalReReviewHostedService sut = new(
            queue,
            NullLogger<EvidenceAddedIncrementalReReviewHostedService>.Instance);
        TaskCompletionSource invoked = new(TaskCreationOptions.RunContinuationsAsynchronously);

        await sut.StartAsync(CancellationToken.None);

        try
        {
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
