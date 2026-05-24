using ArchLucid.AgentRuntime.Traces;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class AgentExecutionTraceMapperTests
{
    [Fact]
    public void Split_then_merge_round_trips_full_trace()
    {
        AgentExecutionTrace original = new()
        {
            TraceId = "abc123",
            RunId = "run-1",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            SystemPrompt = "system",
            UserPrompt = "user",
            RawResponse = "{\"ok\":true}",
            ParsedResultJson = "{\"ok\":true}",
            ParseSucceeded = true,
            InputTokenCount = 10,
            OutputTokenCount = 20,
            EstimatedCostUsd = 0.001m,
            ModelDeploymentName = "gpt-test",
            QualityWarning = true,
        };

        (AgentExecutionTraceSummary summary, AgentExecutionTraceDetail detail) =
            AgentExecutionTraceMapper.Split(original);

        AgentExecutionTrace merged = AgentExecutionTraceMapper.Merge(summary, detail);

        merged.TraceId.Should().Be(original.TraceId);
        merged.RunId.Should().Be(original.RunId);
        merged.SystemPrompt.Should().Be(original.SystemPrompt);
        merged.UserPrompt.Should().Be(original.UserPrompt);
        merged.RawResponse.Should().Be(original.RawResponse);
        merged.InputTokenCount.Should().Be(original.InputTokenCount);
        merged.QualityWarning.Should().BeTrue();
    }

    [Fact]
    public void Summary_from_trace_has_at_most_twelve_cross_context_properties()
    {
        AgentExecutionTrace trace = new()
        {
            AgentType = AgentType.Compliance,
            ParseSucceeded = false,
            QualityRejected = true,
        };

        AgentExecutionTraceSummary summary = AgentExecutionTraceSummary.FromTrace(trace);

        typeof(AgentExecutionTraceSummary).GetProperties().Length.Should().BeLessOrEqualTo(12);
        summary.QualityRejected.Should().BeTrue();
    }
}
