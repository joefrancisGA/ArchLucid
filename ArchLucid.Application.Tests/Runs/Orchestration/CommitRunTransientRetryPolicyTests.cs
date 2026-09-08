using ArchLucid.Application.Runs.Orchestration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CommitRunTransientRetryPolicyTests
{
    [Fact]
    public void IsExhausted_returns_true_when_attempt_limit_is_reached()
    {
        bool exhausted = CommitRunTransientRetryPolicy.IsExhausted(
            CommitRunTransientRetryPolicy.MaxAttempts,
            TimeSpan.Zero);

        exhausted.Should().BeTrue();
    }

    [Fact]
    public void IsExhausted_returns_true_when_retry_budget_is_reached()
    {
        bool exhausted = CommitRunTransientRetryPolicy.IsExhausted(
            1,
            CommitRunTransientRetryPolicy.RetryBudget);

        exhausted.Should().BeTrue();
    }

    [Fact]
    public void Delays_preserve_the_existing_linear_backoff()
    {
        CommitRunTransientRetryPolicy.RetryDelay(3).Should().Be(TimeSpan.FromMilliseconds(450));
        CommitRunTransientRetryPolicy.ManifestReconcilePollDelay(2).Should().Be(TimeSpan.FromMilliseconds(300));
    }

    [Fact]
    public void IsExhausted_returns_false_when_attempt_and_elapsed_are_below_limits()
    {
        CommitRunTransientRetryPolicy.IsExhausted(1, TimeSpan.Zero).Should().BeFalse();
        CommitRunTransientRetryPolicy.IsExhausted(11, TimeSpan.FromSeconds(19)).Should().BeFalse();
    }

    [Fact]
    public void ManifestReconcilePollDelay_sum_for_inter_poll_waits_fits_inside_retry_budget()
    {
        TimeSpan interPollDelayTotal = Enumerable
            .Range(1, CommitRunTransientRetryPolicy.ManifestReconcilePollAttempts - 1)
            .Select(CommitRunTransientRetryPolicy.ManifestReconcilePollDelay)
            .Aggregate(TimeSpan.Zero, static (sum, delay) => sum + delay);

        interPollDelayTotal.Should().BeLessThan(CommitRunTransientRetryPolicy.RetryBudget);
    }
}
