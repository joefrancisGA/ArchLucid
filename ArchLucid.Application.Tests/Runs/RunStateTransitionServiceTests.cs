using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunStateTransitionServiceTests
{
    private readonly RunStateTransitionService _sut = new();

    [Fact]
    public void ValidateCommitAllowed_permits_only_ready_for_commit()
    {
        _sut.ValidateCommitAllowed(ArchitectureRunStatus.ReadyForCommit).IsAllowed.Should().BeTrue();
    }

    [Theory]
    [InlineData(ArchitectureRunStatus.TasksGenerated)]
    [InlineData(ArchitectureRunStatus.PartiallyCompleted)]
    [InlineData(ArchitectureRunStatus.FailedPartial)]
    [InlineData(ArchitectureRunStatus.Failed)]
    public void ValidateCommitAllowed_denies_incomplete_and_failed_statuses(ArchitectureRunStatus status)
    {
        _sut.ValidateCommitAllowed(status).IsAllowed.Should().BeFalse();
    }

    [Fact]
    public void ValidateCommitAllowed_denies_failed_with_actionable_message()
    {
        RunStateTransitionCheck check = _sut.ValidateCommitAllowed(ArchitectureRunStatus.Failed);

        check.IsAllowed.Should().BeFalse();
        check.Message.Should().Contain("Failed");
    }

    [Fact]
    public void ValidateCommitAllowedLegacy_permits_ready_for_commit_only()
    {
        _sut.ValidateCommitAllowedLegacy(nameof(ArchitectureRunStatus.ReadyForCommit)).IsAllowed.Should().BeTrue();
        _sut.ValidateCommitAllowedLegacy(nameof(ArchitectureRunStatus.TasksGenerated)).IsAllowed.Should().BeFalse();
        _sut.ValidateCommitAllowedLegacy(nameof(ArchitectureRunStatus.PartiallyCompleted)).IsAllowed.Should().BeFalse();
        _sut.ValidateCommitAllowedLegacy(nameof(ArchitectureRunStatus.FailedPartial)).IsAllowed.Should().BeFalse();
    }

    [Fact]
    public void HasAllRequiredAgentResults_requires_exactly_one_per_agent_type()
    {
        List<AgentResult> complete =
        [
            NewResult(AgentType.Topology),
            NewResult(AgentType.Cost),
            NewResult(AgentType.Compliance),
            NewResult(AgentType.Critic)
        ];

        _sut.HasAllRequiredAgentResults(complete).Should().BeTrue();
        _sut.HasAllRequiredAgentResults(complete.Take(3).ToList()).Should().BeFalse();
    }

    [Fact]
    public void HasCommitReadyAgentResults_requires_meaningful_non_degraded_results()
    {
        List<AgentResult> emptyShell =
        [
            NewResult(AgentType.Topology),
            NewResult(AgentType.Cost),
            NewResult(AgentType.Compliance),
            NewResult(AgentType.Critic)
        ];

        _sut.HasCommitReadyAgentResults(emptyShell).Should().BeFalse();
        _sut.HasCommitReadyAgentResults(CommitReadySet()).Should().BeTrue();
        _sut.HasCommitReadyAgentResults(CommitReadySet().Take(3).ToList()).Should().BeFalse();
    }

    [Fact]
    public void DeriveStatusAfterResultSubmission_maps_to_ready_or_waiting()
    {
        _sut.DeriveStatusAfterResultSubmission(CommitReadySet()).Should().Be(ArchitectureRunStatus.ReadyForCommit);
        _sut.DeriveStatusAfterResultSubmission([CommitReady(AgentType.Topology)])
            .Should()
            .Be(ArchitectureRunStatus.WaitingForResults);
    }

    [Fact]
    public void DeriveStatusAfterExecuteCompletion_maps_partial_when_incomplete()
    {
        _sut.DeriveStatusAfterExecuteCompletion(CommitReadySet()).Should().Be(ArchitectureRunStatus.ReadyForCommit);
        _sut.DeriveStatusAfterExecuteCompletion([CommitReady(AgentType.Topology)])
            .Should()
            .Be(ArchitectureRunStatus.PartiallyCompleted);
    }

    [Fact]
    public void DeriveStatusAfterExecuteFailure_maps_failed_partial_when_any_required_succeeded()
    {
        _sut.DeriveStatusAfterExecuteFailure([CommitReady(AgentType.Topology)])
            .Should()
            .Be(ArchitectureRunStatus.FailedPartial);
        _sut.DeriveStatusAfterExecuteFailure([]).Should().Be(ArchitectureRunStatus.Failed);
        _sut.DeriveStatusAfterExecuteFailure(null).Should().Be(ArchitectureRunStatus.Failed);
    }

    [Fact]
    public void ShouldSkipQueuedAuthorityPipelineCompletion_when_context_exists()
    {
        _sut.ShouldSkipQueuedAuthorityPipelineCompletion(Guid.NewGuid()).Should().BeTrue();
        _sut.ShouldSkipQueuedAuthorityPipelineCompletion(null).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Created")]
    public void ShouldSetTasksGeneratedAfterDeferredMaterialize_allows_created_or_unset(string? status)
    {
        _sut.ShouldSetTasksGeneratedAfterDeferredMaterialize(status).Should().BeTrue();
    }

    [Theory]
    [InlineData("TasksGenerated")]
    [InlineData("ReadyForCommit")]
    [InlineData("WaitingForResults")]
    [InlineData("Committed")]
    [InlineData("PartiallyCompleted")]
    public void ShouldSetTasksGeneratedAfterDeferredMaterialize_rejects_advanced_or_terminal(string status)
    {
        _sut.ShouldSetTasksGeneratedAfterDeferredMaterialize(status).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Created")]
    public void ShouldApplyCoordinationLegacyStatusPatch_allows_tasks_generated_target_on_created_or_unset(string? status)
    {
        _sut.ShouldApplyCoordinationLegacyStatusPatch(status, nameof(ArchitectureRunStatus.TasksGenerated)).Should().BeTrue();
    }

    [Theory]
    [InlineData("TasksGenerated")]
    [InlineData("ReadyForCommit")]
    [InlineData("WaitingForResults")]
    [InlineData("Committed")]
    [InlineData("PartiallyCompleted")]
    public void ShouldApplyCoordinationLegacyStatusPatch_rejects_tasks_generated_downgrade(string status)
    {
        _sut.ShouldApplyCoordinationLegacyStatusPatch(status, nameof(ArchitectureRunStatus.TasksGenerated)).Should().BeFalse();
    }

    [Fact]
    public void ShouldApplyCoordinationLegacyStatusPatch_skips_when_target_equals_current()
    {
        _sut.ShouldApplyCoordinationLegacyStatusPatch(
            nameof(ArchitectureRunStatus.TasksGenerated),
            nameof(ArchitectureRunStatus.TasksGenerated)).Should().BeFalse();

        _sut.ShouldApplyCoordinationLegacyStatusPatch(
            nameof(ArchitectureRunStatus.Created),
            nameof(ArchitectureRunStatus.Created)).Should().BeFalse();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void ShouldApplyCoordinationLegacyStatusPatch_allows_created_target_on_created_or_unset(string? status)
    {
        _sut.ShouldApplyCoordinationLegacyStatusPatch(status, nameof(ArchitectureRunStatus.Created)).Should().BeTrue();
    }

    [Theory]
    [InlineData("Committed")]
    [InlineData("ReadyForCommit")]
    [InlineData("TasksGenerated")]
    public void ShouldApplyCoordinationLegacyStatusPatch_rejects_created_downgrade(string status)
    {
        _sut.ShouldApplyCoordinationLegacyStatusPatch(status, nameof(ArchitectureRunStatus.Created)).Should().BeFalse();
    }

    // TB-305 / ADR 0042 (decision C): the POST /result extension point is append-only-to-in-progress and cannot finalize.
    [Theory]
    [InlineData(ArchitectureRunStatus.TasksGenerated)]
    [InlineData(ArchitectureRunStatus.WaitingForResults)]
    [InlineData(ArchitectureRunStatus.PartiallyCompleted)]
    [InlineData(ArchitectureRunStatus.FailedPartial)]
    public void ValidateResultSubmissionAllowed_permits_in_progress_and_partial_statuses(ArchitectureRunStatus status)
    {
        _sut.ValidateResultSubmissionAllowed(status).IsAllowed.Should().BeTrue();
    }

    [Theory]
    [InlineData(ArchitectureRunStatus.Committed)]
    [InlineData(ArchitectureRunStatus.ReadyForCommit)]
    [InlineData(ArchitectureRunStatus.Failed)]
    [InlineData(ArchitectureRunStatus.Created)]
    [InlineData(ArchitectureRunStatus.ExecutionCompletedQualityRejected)]
    public void ValidateResultSubmissionAllowed_denies_committed_and_terminal_statuses(ArchitectureRunStatus status)
    {
        _sut.ValidateResultSubmissionAllowed(status).IsAllowed.Should().BeFalse();
    }

    [Fact]
    public void ResultSubmissionAllowedStatuses_excludes_committed()
    {
        _sut.ResultSubmissionAllowedStatuses.Should().NotContain(ArchitectureRunStatus.Committed);
    }

    private static List<AgentResult> CommitReadySet()
    {
        return
        [
            CommitReady(AgentType.Topology),
            CommitReady(AgentType.Cost),
            CommitReady(AgentType.Compliance),
            CommitReady(AgentType.Critic)
        ];
    }

    private static AgentResult CommitReady(AgentType agentType)
    {
        AgentResult result = NewResult(agentType);
        result.Claims = ["ok"];

        return result;
    }

    private static AgentResult NewResult(AgentType agentType)
    {
        return new AgentResult
        {
            ResultId = Guid.NewGuid().ToString("N"),
            RunId = Guid.NewGuid().ToString("N"),
            TaskId = Guid.NewGuid().ToString("N"),
            AgentType = agentType,
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }
}
