using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AgentEvaluation;

[Trait("Category", "Unit")]
public sealed class AgentExecutionTraceLatestPerTaskSelectorTests
{
    [Fact]
    public void Select_when_created_utc_ties_prefers_highest_attempt_index()
    {
        const string taskId = "task-attempt-tie";
        DateTime sharedUtc = new(2026, 3, 1, 9, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace rejectedAttempt = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = taskId,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
        };
        AgentExecutionTrace acceptedRetry = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = taskId,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 2,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([rejectedAttempt, acceptedRetry]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-attempt-2");
    }

    [Fact]
    public void Select_when_created_utc_differs_prefers_highest_attempt_index_over_newer_superseded_timestamp()
    {
        const string taskId = "task-attempt-authority";
        DateTime olderUtc = new(2026, 4, 1, 8, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 4, 1, 8, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = taskId,
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace acceptedRetry = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = taskId,
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([supersededRejected, acceptedRetry]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-attempt-2");
    }
}
