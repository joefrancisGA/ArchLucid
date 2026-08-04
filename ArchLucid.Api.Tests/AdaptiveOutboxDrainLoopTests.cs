using ArchLucid.Host.Core.Hosted;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AdaptiveOutboxDrainLoopTests
{
    [Fact]
    public async Task RunAsync_drains_back_to_back_without_idle_delay_while_work_returned()
    {
        int calls = 0;
        using CancellationTokenSource cts = new();

        await AdaptiveOutboxDrainLoop.RunAsync(
            _ =>
            {
                calls++;

                if (calls >= 5)
                    cts.Cancel();

                return Task.FromResult(1);
            },
            NullLogger.Instance,
            "Test outbox",
            cts.Token);

        calls.Should().BeGreaterThanOrEqualTo(5);
    }

    [Fact]
    public async Task RunAsync_continues_after_processor_exception()
    {
        int calls = 0;
        using CancellationTokenSource cts = new();

        await AdaptiveOutboxDrainLoop.RunAsync(
            _ =>
            {
                calls++;

                if (calls == 1)
                    throw new InvalidOperationException("simulated failure");

                cts.Cancel();

                return Task.FromResult(1);
            },
            NullLogger.Instance,
            "Test outbox",
            cts.Token);

        calls.Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public async Task RunAsync_exits_cleanly_when_cancelled_during_idle_delay()
    {
        using CancellationTokenSource cts = new();

        Task loop = AdaptiveOutboxDrainLoop.RunAsync(
            _ => Task.FromResult(0),
            NullLogger.Instance,
            "Test outbox",
            cts.Token);

        await Task.Delay(100, CancellationToken.None);
        await cts.CancelAsync();

        Func<Task> act = () => loop;

        await act.Should().NotThrowAsync();
    }
}
