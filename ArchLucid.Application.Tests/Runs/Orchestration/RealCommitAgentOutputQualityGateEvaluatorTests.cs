using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class RealCommitAgentOutputQualityGateEvaluatorTests
{
    [Fact]
    public void GetBlockingReasons_when_real_pilot_strict_and_trace_rejected_returns_reason()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-1",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [trace]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-1");
    }

    [Fact]
    public void GetBlockingReasons_when_simulator_mode_returns_empty()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Simulator };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-1",
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [trace])
            .Should().BeEmpty();
    }

    [Fact]
    public void GetBlockingReasons_when_quality_rejected_flag_set_with_non_rejected_recorded_outcome_still_blocks()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-mismatch",
            AgentType = AgentType.Cost,
            // Durable reject flag can be patched after an earlier non-reject recorded outcome.
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [trace]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-mismatch");
    }

    [Fact]
    public void GetBlockingReasons_ignores_superseded_rejected_trace_when_latest_trace_accepted()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        const string taskId = "task-retry";
        DateTime olderUtc = new(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 1, 1, 12, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-first-attempt",
            TaskId = taskId,
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace latestAccepted = new()
        {
            TraceId = "trace-retry-success",
            TaskId = taskId,
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededRejected, latestAccepted]);

        reasons.Should().BeEmpty();
    }

    [Fact]
    public void GetBlockingReasons_blocks_when_latest_trace_rejected_even_if_older_trace_accepted()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        const string taskId = "task-regression";
        DateTime olderUtc = new(2026, 2, 1, 8, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 2, 1, 8, 10, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededAccepted = new()
        {
            TraceId = "trace-accepted-first",
            TaskId = taskId,
            AgentType = AgentType.Compliance,
            CreatedUtc = olderUtc,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };
        AgentExecutionTrace latestRejected = new()
        {
            TraceId = "trace-rejected-latest",
            TaskId = taskId,
            AgentType = AgentType.Compliance,
            CreatedUtc = newerUtc,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededAccepted, latestRejected]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-rejected-latest");
    }

    [Fact]
    public void GetBlockingReasons_when_created_utc_ties_prefers_highest_attempt_index_accepted_trace()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        const string taskId = "task-attempt-tie";
        DateTime sharedUtc = new(2026, 3, 1, 9, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace rejectedAttempt = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = taskId,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace acceptedRetry = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = taskId,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [rejectedAttempt, acceptedRetry]);

        reasons.Should().BeEmpty();
    }

    [Fact]
    public void GetBlockingReasons_when_superseded_rejected_has_newer_created_utc_ignores_it_for_higher_attempt_index_accepted_trace()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        const string taskId = "task-skewed-timestamp";
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

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededRejected, acceptedRetry]);

        reasons.Should().BeEmpty();
    }
}
