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

    [Fact]
    public void RetryDelay_and_manifest_poll_delay_reject_non_positive_poll_or_attempt()
    {
        CommitRunTransientRetryPolicy.RetryDelay(0).Should().Be(TimeSpan.Zero);
        CommitRunTransientRetryPolicy.ManifestReconcilePollDelay(0).Should().Be(TimeSpan.Zero);
    }

    [Fact]
    public void IsExhausted_returns_false_when_elapsed_is_just_below_retry_budget()
    {
        CommitRunTransientRetryPolicy.IsExhausted(
            11,
            CommitRunTransientRetryPolicy.RetryBudget - TimeSpan.FromMilliseconds(1))
            .Should()
            .BeFalse();
    }

    [Fact]
    public void RetryDelay_at_max_attempt_uses_linear_backoff_multiplier()
    {
        CommitRunTransientRetryPolicy.RetryDelay(CommitRunTransientRetryPolicy.MaxAttempts)
            .Should()
            .Be(TimeSpan.FromMilliseconds(150 * CommitRunTransientRetryPolicy.MaxAttempts));
    }

    [Fact]
    public void IsExhausted_returns_false_at_attempt_zero()
    {
        CommitRunTransientRetryPolicy.IsExhausted(0, TimeSpan.Zero).Should().BeFalse();
    }

    [Fact]
    public void ManifestReconcilePollDelay_at_max_poll_uses_linear_backoff_multiplier()
    {
        CommitRunTransientRetryPolicy.ManifestReconcilePollDelay(CommitRunTransientRetryPolicy.ManifestReconcilePollAttempts)
            .Should()
            .Be(TimeSpan.FromMilliseconds(150 * CommitRunTransientRetryPolicy.ManifestReconcilePollAttempts));
    }

    [Fact]
    public void IsExhausted_returns_true_when_attempt_and_elapsed_both_exceed_limits()
    {
        CommitRunTransientRetryPolicy.IsExhausted(
            CommitRunTransientRetryPolicy.MaxAttempts + 1,
            CommitRunTransientRetryPolicy.RetryBudget + TimeSpan.FromSeconds(1))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsExhausted_returns_true_when_elapsed_exactly_equals_retry_budget()
    {
        CommitRunTransientRetryPolicy.IsExhausted(1, CommitRunTransientRetryPolicy.RetryBudget)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void RetryDelay_sum_for_inter_attempt_waits_fits_inside_retry_budget()
    {
        TimeSpan interAttemptDelayTotal = Enumerable
            .Range(1, CommitRunTransientRetryPolicy.MaxAttempts - 1)
            .Select(CommitRunTransientRetryPolicy.RetryDelay)
            .Aggregate(TimeSpan.Zero, static (sum, delay) => sum + delay);

        interAttemptDelayTotal.Should().BeLessThan(CommitRunTransientRetryPolicy.RetryBudget);
    }

    [Fact]
    public void IsExhausted_returns_false_at_attempt_one_below_max_with_zero_elapsed()
    {
        CommitRunTransientRetryPolicy.IsExhausted(
                CommitRunTransientRetryPolicy.MaxAttempts - 1,
                TimeSpan.Zero)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsExhausted_returns_true_at_max_attempts_with_elapsed_below_budget()
    {
        CommitRunTransientRetryPolicy.IsExhausted(
                CommitRunTransientRetryPolicy.MaxAttempts,
                CommitRunTransientRetryPolicy.RetryBudget - TimeSpan.FromSeconds(1))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsExhausted_returns_true_at_attempt_zero_when_elapsed_exceeds_budget()
    {
        CommitRunTransientRetryPolicy.IsExhausted(
                0,
                CommitRunTransientRetryPolicy.RetryBudget)
            .Should()
            .BeTrue();
    }
}
