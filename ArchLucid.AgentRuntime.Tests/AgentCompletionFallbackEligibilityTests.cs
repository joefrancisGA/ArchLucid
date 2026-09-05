using ArchLucid.Core.Resilience;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class AgentCompletionFallbackEligibilityTests
{
    [Fact]
    public void IsFallbackEligible_circuit_breaker_open_is_true()
    {
        AgentCompletionFallbackEligibility.IsFallbackEligible(new CircuitBreakerOpenException("open"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsFallbackEligible_http_without_status_is_true()
    {
        AgentCompletionFallbackEligibility.IsFallbackEligible(new HttpRequestException("network"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsFallbackEligible_timeout_is_true()
    {
        AgentCompletionFallbackEligibility.IsFallbackEligible(new TaskCanceledException("timeout"))
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsFallbackEligible_bad_request_is_false()
    {
        AgentCompletionFallbackEligibility.IsFallbackEligible(
                new HttpRequestException("bad", null, System.Net.HttpStatusCode.BadRequest))
            .Should()
            .BeFalse();
    }

    [Fact]
    public void IsFallbackEligible_invalid_operation_is_false()
    {
        AgentCompletionFallbackEligibility.IsFallbackEligible(new InvalidOperationException("empty"))
            .Should()
            .BeFalse();
    }
}
