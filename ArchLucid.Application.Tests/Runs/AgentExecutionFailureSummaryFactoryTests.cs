using System.Net.Http;
using System.Text.Json;

using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core;
using ArchLucid.Core.Resilience;

using FluentAssertions;

using Polly.Timeout;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentExecutionFailureSummaryFactoryTests
{
    [Fact]
    public void FromException_when_AgentHandlerExecutionException_preserves_agent_and_classifies_inner_timeout()
    {
        TimeoutRejectedException inner = new();

        AgentHandlerExecutionException wrapped = new(AgentTypeKeys.Topology, AgentType.Topology, inner);
        AgentExecutionFailureSummary summary = AgentExecutionFailureSummaryFactory.FromException(wrapped);

        summary.AgentTypeKey.Should().Be(AgentTypeKeys.Topology);
        summary.AgentType.Should().Be(nameof(AgentType.Topology));
        summary.FailureClass.Should().Be(AgentExecutionFailureClasses.Timeout);
        summary.ReasonCode.Should().BeNull();
    }

    [Fact]
    public void FromException_when_inner_is_canceled_CLASSIFIES_canceled()
    {
        TaskCanceledException inner = new();
        AgentHandlerExecutionException wrapped = new(AgentTypeKeys.Critic, AgentType.Critic, inner);
        AgentExecutionFailureSummary summary = AgentExecutionFailureSummaryFactory.FromException(wrapped);

        summary.FailureClass.Should().Be(AgentExecutionFailureClasses.Canceled);
        summary.AgentTypeKey.Should().Be(AgentTypeKeys.Critic);
    }

    [Fact]
    public void FromException_when_inner_is_json_exception_CLASSIFIES_parse()
    {
        JsonException inner = new();
        AgentHandlerExecutionException wrapped = new(AgentTypeKeys.Compliance, AgentType.Compliance, inner);
        AgentExecutionFailureSummary summary = AgentExecutionFailureSummaryFactory.FromException(wrapped);

        summary.FailureClass.Should().Be(AgentExecutionFailureClasses.Parse);
    }

    [Fact]
    public void FromException_when_inner_circuit_breaker_sets_reason_code()
    {
        CircuitBreakerOpenException inner = new("circuit test");
        AgentHandlerExecutionException wrapped = new(AgentTypeKeys.Cost, AgentType.Cost, inner);
        AgentExecutionFailureSummary summary = AgentExecutionFailureSummaryFactory.FromException(wrapped);

        summary.FailureClass.Should().Be(AgentExecutionFailureClasses.CircuitBreaker);
        summary.ReasonCode.Should().Be(AgentExecutionTraceFailureReasonCodes.CircuitBreakerRejected);
    }

    [Fact]
    public void FromException_when_inner_quota_sets_reason_code()
    {
        LlmTokenQuotaExceededException inner = new("quota");
        AgentHandlerExecutionException wrapped = new(AgentTypeKeys.Cost, AgentType.Cost, inner);
        AgentExecutionFailureSummary summary = AgentExecutionFailureSummaryFactory.FromException(wrapped);

        summary.FailureClass.Should().Be(AgentExecutionFailureClasses.Quota);
        summary.ReasonCode.Should().Be(AgentExecutionTraceFailureReasonCodes.LlmTokenQuotaExceeded);
    }

    [Fact]
    public void FromException_when_aggregate_prefers_non_canceled_inner_and_finds_agent_wrapped()
    {
        AgentHandlerExecutionException topologyFailed = new(
            AgentTypeKeys.Topology,
            AgentType.Topology,
            new InvalidOperationException("x"));
        TaskCanceledException noise = new();
        AggregateException aggregate = new(topologyFailed, noise);

        AgentExecutionFailureSummary summary = AgentExecutionFailureSummaryFactory.FromException(aggregate);

        summary.AgentTypeKey.Should().Be(AgentTypeKeys.Topology);
        summary.FailureClass.Should().Be(AgentExecutionFailureClasses.InvalidOperation);
    }

    [Fact]
    public void FromException_when_http_dependency_CLASSIFIES_dependency()
    {
        HttpRequestException inner = new();
        AgentExecutionFailureSummary summary = AgentExecutionFailureSummaryFactory.FromException(inner);

        summary.FailureClass.Should().Be(AgentExecutionFailureClasses.Dependency);
        summary.AgentTypeKey.Should().BeNull();
    }
}
