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
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };
        AgentExecutionTrace latestRejected = new()
        {
            TraceId = "trace-rejected-latest",
            TaskId = taskId,
            AgentType = AgentType.Compliance,
            CreatedUtc = newerUtc,
            AttemptIndex = 2,
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

    [Fact]
    public void GetBlockingReasons_when_task_id_missing_groups_by_agent_type_not_single_empty_task()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime sharedUtc = new(2026, 5, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace rejectedTopology = new()
        {
            TraceId = "trace-a-topology",
            TaskId = string.Empty,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace acceptedCost = new()
        {
            TraceId = "trace-z-cost",
            TaskId = string.Empty,
            AgentType = AgentType.Cost,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [rejectedTopology, acceptedCost]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-a-topology");
    }

    [Fact]
    public void GetBlockingReasons_when_task_id_differs_only_by_casing_chains_retries()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime sharedUtc = new(2026, 9, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace acceptedRetry = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "Task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
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

    [Fact]
    public void GetBlockingReasons_empty_task_id_same_agent_retry_ignores_superseded_rejected_trace()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime sharedUtc = new(2026, 6, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = string.Empty,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace acceptedRetry = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = string.Empty,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
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

    [Fact]
    public void GetBlockingReasons_when_task_id_differs_only_by_outer_whitespace_chains_retries()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime sharedUtc = new(2026, 10, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = " task-1 ",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace acceptedRetry = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
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

    [Fact]
    public void GetBlockingReasons_when_different_agent_types_share_task_id_does_not_block_on_superseded_rejected_topology()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime sharedUtc = new(2026, 11, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace rejectedTopology = new()
        {
            TraceId = "trace-topology-rejected",
            TaskId = "shared-task",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace acceptedCost = new()
        {
            TraceId = "trace-cost-accepted",
            TaskId = "shared-task",
            AgentType = AgentType.Cost,
            CreatedUtc = sharedUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [rejectedTopology, acceptedCost]);

        reasons.Should().BeEmpty(
            "selector groups by TaskId only; abnormal cross-agent TaskId collision is not reachable from GUID AgentTask ids");
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_rejected_and_warned_duplicates_prefers_warned_and_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime sharedUtc = new(2026, 11, 2, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace rejectedDuplicate = new()
        {
            TraceId = "trace-z-rejected",
            TaskId = "task-warn-tie",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace warnedDuplicate = new()
        {
            TraceId = "trace-a-warned",
            TaskId = "task-warn-tie",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [rejectedDuplicate, warnedDuplicate]);

        reasons.Should().BeEmpty(
            "quality-preference tie-break intentionally prefers non-blocking Warned over Rejected duplicate rows");
    }

    [Fact]
    public void GetBlockingReasons_when_gate_disabled_returns_empty_even_with_rejected_traces()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = false,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-rejected",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [trace])
            .Should().BeEmpty();
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_duplicates_with_different_created_utc_does_not_block_on_newer_rejected()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 1, 10, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 1, 10, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace acceptedDuplicate = new()
        {
            TraceId = "trace-a-accepted",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };
        AgentExecutionTrace rejectedDuplicate = new()
        {
            TraceId = "trace-z-rejected",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [rejectedDuplicate, acceptedDuplicate]);

        reasons.Should().BeEmpty(
            "upsert-drift duplicate rows at the same attempt must not block commit when an accepted trace exists");
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_duplicates_include_unevaluated_and_rejected_still_blocks()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 2, 10, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 2, 10, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace unevaluatedDuplicate = new()
        {
            TraceId = "trace-a-unevaluated",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };
        AgentExecutionTrace rejectedDuplicate = new()
        {
            TraceId = "trace-z-rejected",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [unevaluatedDuplicate, rejectedDuplicate]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-z-rejected");
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_rejected_newer_and_warned_older_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 3, 10, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 3, 10, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace warnedDuplicate = new()
        {
            TraceId = "trace-a-warned",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
        };
        AgentExecutionTrace rejectedDuplicate = new()
        {
            TraceId = "trace-z-rejected",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [rejectedDuplicate, warnedDuplicate])
            .Should().BeEmpty(
                "quality-preference tie-break intentionally prefers non-blocking Warned over Rejected duplicate rows");
    }

    [Fact]
    public void GetBlockingReasons_when_quality_rejected_with_warned_recorded_outcome_still_blocks()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-warned-but-rejected",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [trace]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-warned-but-rejected");
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_unevaluated_newer_and_accepted_older_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 4, 10, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 4, 10, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace acceptedDuplicate = new()
        {
            TraceId = "trace-a-accepted",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };
        AgentExecutionTrace unevaluatedDuplicate = new()
        {
            TraceId = "trace-z-unevaluated",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [unevaluatedDuplicate, acceptedDuplicate])
            .Should().BeEmpty();
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_quality_rejected_and_warned_duplicates_prefers_warned_and_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime sharedUtc = new(2026, 12, 4, 11, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace qualityRejectedDuplicate = new()
        {
            TraceId = "trace-q-rejected-flag",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityRejected = true,
        };
        AgentExecutionTrace warnedDuplicate = new()
        {
            TraceId = "trace-w-warned",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [qualityRejectedDuplicate, warnedDuplicate])
            .Should().BeEmpty(
                "quality-preference tie-break intentionally prefers non-blocking Warned over blocking duplicate rows");
    }

    [Fact]
    public void GetBlockingReasons_when_higher_attempt_unevaluated_does_not_block_on_superseded_rejected_trace()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 10, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 10, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace latestUnevaluated = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededRejected, latestUnevaluated])
            .Should().BeEmpty(
                "TB-2226 fail-closed scope is recorded rejections on the winning attempt; execute→evaluate→commit records outcomes before seal");
    }

    [Fact]
    public void GetBlockingReasons_when_higher_attempt_rejected_still_blocks_even_if_lower_attempt_unevaluated()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 12, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 12, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededUnevaluated = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };
        AgentExecutionTrace latestRejected = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededUnevaluated, latestRejected]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-attempt-2");
    }

    [Fact]
    public void GetBlockingReasons_when_higher_attempt_warned_does_not_block_on_superseded_rejected_trace()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 13, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 13, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace latestWarned = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededRejected, latestWarned])
            .Should().BeEmpty(
                "AttemptIndex supersedes quality rank; Warned winning attempt is intentionally non-blocking");
    }

    [Fact]
    public void GetBlockingReasons_when_quality_rejected_flag_set_with_null_recorded_outcome_still_blocks()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-qr-null",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = null,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [trace]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-qr-null");
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_quality_rejected_null_outcome_duplicate_still_blocks()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 14, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 14, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace blockingDuplicate = new()
        {
            TraceId = "trace-qr-null",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = null,
            QualityRejected = true,
        };
        AgentExecutionTrace unevaluatedDuplicate = new()
        {
            TraceId = "trace-unevaluated",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [unevaluatedDuplicate, blockingDuplicate]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-qr-null");
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_task_id_differs_only_by_whitespace_prefers_accepted_trace_after_upsert()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime sharedUtc = new(2026, 10, 2, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-z-rejected",
            TaskId = " task-1 ",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace accepted = new()
        {
            TraceId = "trace-a-accepted",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededRejected, accepted]);

        reasons.Should().BeEmpty(
            "duplicate same-attempt rows from whitespace TaskId upsert drift must not block commit when an accepted trace exists");
    }

    [Fact]
    public void GetBlockingReasons_when_higher_attempt_accepted_does_not_block_on_superseded_rejected_trace()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 15, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 15, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace latestAccepted = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededRejected, latestAccepted])
            .Should().BeEmpty(
                "AttemptIndex supersedes quality rank; Accepted winning attempt is intentionally non-blocking");
    }

    [Fact]
    public void GetBlockingReasons_when_warn_only_mode_returns_empty_even_with_rejected_traces()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.WarnOnly,
        };
        AgentExecutionTrace rejected = new()
        {
            TraceId = "trace-rejected",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [rejected])
            .Should().BeEmpty("TB-2226 fail-closed commit blocking applies only to PilotStrict mode");
    }

    [Fact]
    public void GetBlockingReasons_when_empty_traces_returns_empty()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [])
            .Should().BeEmpty("no traces means no recorded rejections to block on");
    }

    [Fact]
    public void GetBlockingReasons_when_higher_attempt_unevaluated_does_not_block_on_superseded_warned_trace()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 17, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 17, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededWarned = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
            QualityRejected = false,
        };
        AgentExecutionTrace latestUnevaluated = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededWarned, latestUnevaluated])
            .Should().BeEmpty(
                "AttemptIndex supersedes quality rank; unevaluated winning attempt is non-blocking under TB-2226");
    }

    [Fact]
    public void GetBlockingReasons_when_recorded_rejected_outcome_blocks_even_when_quality_rejected_false()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-outcome-only",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = false,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [trace]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-outcome-only");
    }

    [Fact]
    public void GetBlockingReasons_when_distinct_tasks_only_blocks_on_rejected_latest_per_task()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace acceptedTask = new()
        {
            TraceId = "trace-task-1",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };
        AgentExecutionTrace rejectedTask = new()
        {
            TraceId = "trace-task-2",
            TaskId = "task-2",
            AgentType = AgentType.Cost,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [acceptedTask, rejectedTask]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-task-2");
        reasons[0].Should().NotContain("trace-task-1");
    }

    [Fact]
    public void GetBlockingReasons_when_multiple_rejected_tasks_return_multiple_reasons()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace rejectedTopology = new()
        {
            TraceId = "trace-topology",
            TaskId = "task-topology",
            AgentType = AgentType.Topology,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace rejectedCost = new()
        {
            TraceId = "trace-cost",
            TaskId = "task-cost",
            AgentType = AgentType.Cost,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [rejectedTopology, rejectedCost]);

        reasons.Should().HaveCount(2);
        reasons.Should().Contain(r => r.Contains("trace-topology"));
        reasons.Should().Contain(r => r.Contains("trace-cost"));
    }

    [Fact]
    public void GetBlockingReasons_when_higher_attempt_warned_does_not_block_on_superseded_accepted_trace()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 18, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 18, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededAccepted = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityRejected = false,
        };
        AgentExecutionTrace latestWarned = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededAccepted, latestWarned])
            .Should().BeEmpty(
                "AttemptIndex supersedes quality rank; Warned winning attempt is intentionally non-blocking");
    }

    [Fact]
    public void GetBlockingReasons_when_gate_disabled_with_warn_only_mode_returns_empty()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = false,
            Mode = AgentOutputQualityGateMode.WarnOnly,
        };
        AgentExecutionTrace rejected = new()
        {
            TraceId = "trace-rejected",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [rejected])
            .Should().BeEmpty("commit blocking requires Enabled=true and PilotStrict mode");
    }

    [Fact]
    public void GetBlockingReasons_when_higher_attempt_accepted_does_not_block_on_superseded_warned_trace()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 19, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 19, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededWarned = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
            QualityRejected = false,
        };
        AgentExecutionTrace latestAccepted = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededWarned, latestAccepted])
            .Should().BeEmpty(
                "AttemptIndex supersedes quality rank; Accepted winning attempt is intentionally non-blocking");
    }

    [Fact]
    public void GetBlockingReasons_when_distinct_tasks_warned_and_rejected_only_blocks_rejected()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace warnedTask = new()
        {
            TraceId = "trace-warned",
            TaskId = "task-warned",
            AgentType = AgentType.Topology,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
        };
        AgentExecutionTrace rejectedTask = new()
        {
            TraceId = "trace-rejected",
            TaskId = "task-rejected",
            AgentType = AgentType.Cost,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [warnedTask, rejectedTask]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-rejected");
        reasons[0].Should().NotContain("trace-warned");
    }

    [Fact]
    public void GetBlockingReasons_when_single_warned_trace_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace warned = new()
        {
            TraceId = "trace-warned",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [warned])
            .Should().BeEmpty("TB-2226 fail-closed scope is recorded rejections, not Warned outcomes");
    }

    [Fact]
    public void GetBlockingReasons_when_higher_attempt_unevaluated_does_not_block_on_superseded_accepted_trace()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 20, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 20, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededAccepted = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityRejected = false,
        };
        AgentExecutionTrace latestUnevaluated = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [supersededAccepted, latestUnevaluated])
            .Should().BeEmpty(
                "AttemptIndex supersedes quality rank; unevaluated winning attempt is non-blocking under TB-2226");
    }

    [Fact]
    public void GetBlockingReasons_when_distinct_tasks_both_accepted_after_retries_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace topologyRetryChain = new()
        {
            TraceId = "trace-topology-2",
            TaskId = "task-topology",
            AgentType = AgentType.Topology,
            AttemptIndex = 2,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };
        AgentExecutionTrace topologySuperseded = new()
        {
            TraceId = "trace-topology-0",
            TaskId = "task-topology",
            AgentType = AgentType.Topology,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace costRetryChain = new()
        {
            TraceId = "trace-cost-1",
            TaskId = "task-cost",
            AgentType = AgentType.Cost,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };
        AgentExecutionTrace costSuperseded = new()
        {
            TraceId = "trace-cost-0",
            TaskId = "task-cost",
            AgentType = AgentType.Cost,
            AttemptIndex = 0,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [topologySuperseded, topologyRetryChain, costSuperseded, costRetryChain])
            .Should().BeEmpty("each task's winning attempt is Accepted after auto-retry");
    }

    [Fact]
    public void GetBlockingReasons_when_rejected_trace_with_both_flags_returns_single_reason()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace trace = new()
        {
            TraceId = "trace-dual-flag",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [trace]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-dual-flag");
    }

    [Fact]
    public void GetBlockingReasons_when_single_accepted_trace_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace accepted = new()
        {
            TraceId = "trace-accepted",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [accepted])
            .Should().BeEmpty("Accepted outcomes are intentionally non-blocking");
    }

    [Fact]
    public void GetBlockingReasons_when_single_unevaluated_trace_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace unevaluated = new()
        {
            TraceId = "trace-unevaluated",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [unevaluated])
            .Should().BeEmpty("TB-2226 fail-closed scope is recorded rejections on persisted traces");
    }

    [Fact]
    public void GetBlockingReasons_when_multiple_warned_tasks_do_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace topologyWarned = new()
        {
            TraceId = "trace-topology",
            TaskId = "task-topology",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
        };
        AgentExecutionTrace costWarned = new()
        {
            TraceId = "trace-cost",
            TaskId = "task-cost",
            AgentType = AgentType.Cost,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [topologyWarned, costWarned])
            .Should().BeEmpty("Warned outcomes are intentionally non-blocking across tasks");
    }

    [Fact]
    public void GetBlockingReasons_when_distinct_tasks_unevaluated_and_rejected_only_blocks_rejected()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace unevaluatedTask = new()
        {
            TraceId = "trace-unevaluated",
            TaskId = "task-unevaluated",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };
        AgentExecutionTrace rejectedTask = new()
        {
            TraceId = "trace-rejected",
            TaskId = "task-rejected",
            AgentType = AgentType.Cost,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        IReadOnlyList<string> reasons =
            RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [unevaluatedTask, rejectedTask]);

        reasons.Should().ContainSingle();
        reasons[0].Should().Contain("trace-rejected");
        reasons[0].Should().NotContain("trace-unevaluated");
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_accepted_newer_and_rejected_older_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 21, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 21, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace rejectedDuplicate = new()
        {
            TraceId = "trace-r-rejected",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace acceptedDuplicate = new()
        {
            TraceId = "trace-a-accepted",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [rejectedDuplicate, acceptedDuplicate])
            .Should().BeEmpty(
                "rank ladder prefers Accepted duplicate over Rejected when CreatedUtc differs");
    }
    [Fact]
    public void GetBlockingReasons_throws_when_run_null()
    {
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };

        Action act = () => RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
            null!,
            options,
            []);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void GetBlockingReasons_throws_when_options_null()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };

        Action act = () => RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
            run,
            null!,
            []);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void GetBlockingReasons_throws_when_traces_null()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };

        Action act = () => RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
            run,
            options,
            null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void GetBlockingReasons_when_distinct_tasks_all_unevaluated_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace topologyUnevaluated = new()
        {
            TraceId = "trace-topology",
            TaskId = "task-topology",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };
        AgentExecutionTrace costUnevaluated = new()
        {
            TraceId = "trace-cost",
            TaskId = "task-cost",
            AgentType = AgentType.Cost,
            RecordedQualityGateOutcome = null,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [topologyUnevaluated, costUnevaluated])
            .Should().BeEmpty("TB-2226 blocks only recorded rejections on winning traces");
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_quality_rejected_accepted_duplicate_loses_to_clean_accepted_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime olderUtc = new(2026, 12, 5, 22, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 22, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace qualityRejectedAcceptedDuplicate = new()
        {
            TraceId = "trace-qr-accepted",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityRejected = true,
        };
        AgentExecutionTrace cleanAcceptedDuplicate = new()
        {
            TraceId = "trace-clean-accepted",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [qualityRejectedAcceptedDuplicate, cleanAcceptedDuplicate])
            .Should().BeEmpty(
                "rank ladder prefers clean Accepted duplicate over QualityRejected+Accepted drift row");
    }

    [Fact]
    public void GetBlockingReasons_when_same_attempt_quality_rejected_rejected_outcome_and_warned_duplicates_does_not_block()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Real };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        DateTime sharedUtc = new(2026, 12, 5, 23, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace qualityRejectedRejectedDuplicate = new()
        {
            TraceId = "trace-qr-rejected",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace warnedDuplicate = new()
        {
            TraceId = "trace-w-warned",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
            QualityRejected = false,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                run,
                options,
                [qualityRejectedRejectedDuplicate, warnedDuplicate])
            .Should().BeEmpty(
                "Warned duplicate intentionally wins same-attempt upsert-drift tie over QR+Rejected sibling");
    }

    [Fact]
    public void GetBlockingReasons_when_simulator_mode_receives_rejected_traces_without_blocking()
    {
        ArchitectureRun run = new() { StructuralExecutionMode = StructuralExecutionMode.Simulator };
        AgentOutputQualityGateOptions options = new()
        {
            Enabled = true,
            Mode = AgentOutputQualityGateMode.PilotStrict,
        };
        AgentExecutionTrace rejectedTrace = new()
        {
            TraceId = "trace-rejected",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(run, options, [rejectedTrace])
            .Should().BeEmpty(
                "CommitOutputIntegrityService still fetches traces; non-Real bypass is intentional in the evaluator");
    }
}
