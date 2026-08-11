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
}
