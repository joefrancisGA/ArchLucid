using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GreenfieldSqlIntegrationWarmupTests
{
    [Fact]
    public async Task Bootstrap_timeout_fails_the_triggering_test_and_latches_the_shard()
    {
        GreenfieldSqlIntegrationWarmup shard = new();

        WarmupTimedOutException error = await Assert.ThrowsAsync<WarmupTimedOutException>(() =>
            shard.RunUnderBudgetAsync(
                token => Task.Delay(Timeout.InfiniteTimeSpan, token),
                TimeSpan.Zero,
                "test bootstrap",
                CancellationToken.None));

        error.Message.Should().Contain("test bootstrap");
        error.InnerException.Should().BeAssignableTo<OperationCanceledException>();
        shard.ShardWarmupTimedOut.Should().BeTrue();
        Assert.Throws<SkipException>(shard.SkipIfShardWarmupAlreadyTimedOut).Message
            .Should().Be(GreenfieldSqlIntegrationWarmup.ShardOverloadSkipReason);
    }

    [Fact]
    public async Task Caller_cancellation_does_not_trip_the_shard()
    {
        GreenfieldSqlIntegrationWarmup shard = new();
        using CancellationTokenSource caller = new();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            shard.RunUnderBudgetAsync(
                async token =>
                {
                    await caller.CancelAsync();
                    token.ThrowIfCancellationRequested();
                },
                TimeSpan.FromSeconds(10),
                "test bootstrap",
                caller.Token));

        shard.ShardWarmupTimedOut.Should().BeFalse();
    }

    [Fact]
    public async Task Commit_retry_exhaustion_surfaces_without_tripping_the_shard()
    {
        GreenfieldSqlIntegrationWarmup shard = new();
        GreenfieldCommitRetryBudgetExhaustedException expected = new("commit did not complete");

        GreenfieldCommitRetryBudgetExhaustedException error =
            await Assert.ThrowsAsync<GreenfieldCommitRetryBudgetExhaustedException>(() =>
                shard.RunUnderBudgetAsync(
                    _ => Task.FromException(expected),
                    TimeSpan.FromSeconds(10),
                    "test bootstrap",
                    CancellationToken.None));

        error.Should().BeSameAs(expected);
        shard.ShardWarmupTimedOut.Should().BeFalse();
    }
}
