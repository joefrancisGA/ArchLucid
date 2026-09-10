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

    [Fact]
    public void Select_when_task_id_missing_keeps_each_trace_distinct()
    {
        DateTime sharedUtc = new(2026, 5, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace topology = new()
        {
            TraceId = "trace-a-topology",
            TaskId = string.Empty,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
        };
        AgentExecutionTrace cost = new()
        {
            TraceId = "trace-z-cost",
            TaskId = string.Empty,
            AgentType = AgentType.Cost,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([topology, cost]);

        latest.Should().HaveCount(2);
        latest.Select(static t => t.TraceId).Should().BeEquivalentTo(["trace-a-topology", "trace-z-cost"]);
    }

    [Fact]
    public void Select_when_task_id_missing_chains_same_agent_retries_by_attempt_index()
    {
        DateTime sharedUtc = new(2026, 6, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = string.Empty,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
        };
        AgentExecutionTrace acceptedRetry = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = string.Empty,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 2,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([supersededRejected, acceptedRetry]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-attempt-2");
    }

    [Fact]
    public void Select_when_task_id_differs_only_by_outer_whitespace_chains_retries()
    {
        DateTime sharedUtc = new(2026, 7, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = " task-1 ",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
        };
        AgentExecutionTrace acceptedRetry = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 2,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([supersededRejected, acceptedRetry]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-attempt-2");
    }

    [Fact]
    public void Select_when_task_id_differs_only_by_casing_chains_retries()
    {
        DateTime sharedUtc = new(2026, 9, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
        };
        AgentExecutionTrace acceptedRetry = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "Task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 2,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([supersededRejected, acceptedRetry]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-attempt-2");
    }

    [Fact]
    public void Select_when_task_id_is_whitespace_only_chains_with_missing_task_id()
    {
        DateTime sharedUtc = new(2026, 8, 1, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace supersededRejected = new()
        {
            TraceId = "trace-attempt-0",
            TaskId = string.Empty,
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 0,
        };
        AgentExecutionTrace acceptedRetry = new()
        {
            TraceId = "trace-attempt-2",
            TaskId = "   ",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 2,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([supersededRejected, acceptedRetry]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-attempt-2");
    }

    [Fact]
    public void Select_when_different_agent_types_share_task_id_keeps_single_highest_attempt_trace()
    {
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([rejectedTopology, acceptedCost]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-cost-accepted");
    }

    [Fact]
    public void Select_when_same_attempt_duplicates_with_different_created_utc_prefers_non_rejected_trace()
    {
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([rejectedDuplicate, acceptedDuplicate]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-a-accepted");
    }

    [Fact]
    public void Select_when_same_attempt_duplicates_with_unevaluated_and_rejected_prefers_rejected_trace()
    {
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([unevaluatedDuplicate, rejectedDuplicate]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-z-rejected");
    }

    [Fact]
    public void Select_when_same_attempt_rejected_newer_and_warned_older_prefers_warned_trace()
    {
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([rejectedDuplicate, warnedDuplicate]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-a-warned");
    }

    [Fact]
    public void Select_when_same_attempt_unevaluated_newer_and_warned_older_prefers_warned_trace()
    {
        DateTime olderUtc = new(2026, 12, 3, 11, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 3, 11, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace warnedDuplicate = new()
        {
            TraceId = "trace-a-warned",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([unevaluatedDuplicate, warnedDuplicate]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-a-warned");
    }

    [Fact]
    public void Select_when_same_attempt_unevaluated_newer_and_accepted_older_prefers_accepted_trace()
    {
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([unevaluatedDuplicate, acceptedDuplicate]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-a-accepted");
    }

    [Fact]
    public void Select_when_same_attempt_triplicate_prefers_accepted_over_warned_and_rejected()
    {
        DateTime sharedUtc = new(2026, 12, 4, 11, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace rejectedDuplicate = new()
        {
            TraceId = "trace-r-rejected",
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
        };
        AgentExecutionTrace acceptedDuplicate = new()
        {
            TraceId = "trace-a-accepted",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select(
                [rejectedDuplicate, warnedDuplicate, acceptedDuplicate]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-a-accepted");
    }

    [Fact]
    public void Select_when_higher_attempt_unevaluated_wins_over_lower_attempt_rejected()
    {
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([supersededRejected, latestUnevaluated]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-attempt-2");
    }

    [Fact]
    public void Select_when_same_attempt_warned_newer_and_accepted_older_prefers_accepted_trace()
    {
        DateTime olderUtc = new(2026, 12, 5, 11, 0, 0, DateTimeKind.Utc);
        DateTime newerUtc = new(2026, 12, 5, 11, 5, 0, DateTimeKind.Utc);
        AgentExecutionTrace acceptedDuplicate = new()
        {
            TraceId = "trace-a-accepted",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = olderUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };
        AgentExecutionTrace warnedDuplicate = new()
        {
            TraceId = "trace-w-warned",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = newerUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Warned,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([warnedDuplicate, acceptedDuplicate]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-a-accepted");
    }

    [Fact]
    public void Select_when_same_attempt_and_created_utc_ties_prefers_non_rejected_trace()
    {
        DateTime sharedUtc = new(2026, 10, 2, 10, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace rejectedDuplicate = new()
        {
            TraceId = "trace-z-rejected",
            TaskId = " task-1 ",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace acceptedDuplicate = new()
        {
            TraceId = "trace-a-accepted",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([rejectedDuplicate, acceptedDuplicate]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-a-accepted");
    }

    [Fact]
    public void Select_when_higher_attempt_warned_wins_over_lower_attempt_rejected()
    {
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([supersededRejected, latestWarned]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-attempt-2");
    }

    [Fact]
    public void Select_when_same_attempt_quality_rejected_null_outcome_beats_unevaluated_duplicate()
    {
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([unevaluatedDuplicate, blockingDuplicate]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-qr-null");
    }

    [Fact]
    public void Select_when_higher_attempt_accepted_wins_over_lower_attempt_rejected()
    {
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([supersededRejected, latestAccepted]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-attempt-2");
    }

    [Fact]
    public void Select_when_same_attempt_created_utc_and_rank_tie_prefers_lexicographically_greater_trace_id()
    {
        DateTime sharedUtc = new(2026, 12, 5, 16, 0, 0, DateTimeKind.Utc);
        AgentExecutionTrace lowerTraceId = new()
        {
            TraceId = "trace-a",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };
        AgentExecutionTrace higherTraceId = new()
        {
            TraceId = "trace-z",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            CreatedUtc = sharedUtc,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([lowerTraceId, higherTraceId]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-z");
    }

    [Fact]
    public void Select_when_higher_attempt_unevaluated_wins_over_lower_attempt_warned()
    {
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

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([supersededWarned, latestUnevaluated]);

        latest.Should().ContainSingle();
        latest[0].TraceId.Should().Be("trace-attempt-2");
    }

    [Fact]
    public void Select_when_distinct_task_ids_keeps_one_latest_trace_per_task()
    {
        AgentExecutionTrace taskOneAccepted = new()
        {
            TraceId = "trace-task-1",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Accepted,
        };
        AgentExecutionTrace taskTwoRejected = new()
        {
            TraceId = "trace-task-2",
            TaskId = "task-2",
            AgentType = AgentType.Cost,
            AttemptIndex = 1,
            RecordedQualityGateOutcome = AgentOutputQualityGateOutcome.Rejected,
            QualityRejected = true,
        };

        IReadOnlyList<AgentExecutionTrace> latest =
            AgentExecutionTraceLatestPerTaskSelector.Select([taskOneAccepted, taskTwoRejected]);

        latest.Should().HaveCount(2);
        latest.Should().ContainSingle(t => t.TraceId == "trace-task-1");
        latest.Should().ContainSingle(t => t.TraceId == "trace-task-2");
    }
}
