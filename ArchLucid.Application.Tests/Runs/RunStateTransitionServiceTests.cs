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

    [Theory]
    [InlineData(ArchitectureRunStatus.ReadyForCommit)]
    [InlineData(ArchitectureRunStatus.TasksGenerated)]
    public void ValidateCommitAllowed_permits_ready_and_tasks_generated(ArchitectureRunStatus status)
    {
        _sut.ValidateCommitAllowed(status).IsAllowed.Should().BeTrue();
    }

    [Fact]
    public void ValidateCommitAllowed_denies_failed_with_actionable_message()
    {
        RunStateTransitionCheck check = _sut.ValidateCommitAllowed(ArchitectureRunStatus.Failed);

        check.IsAllowed.Should().BeFalse();
        check.Message.Should().Contain("Failed");
    }

    [Theory]
    [InlineData(nameof(ArchitectureRunStatus.ReadyForCommit))]
    [InlineData(nameof(ArchitectureRunStatus.TasksGenerated))]
    public void ValidateCommitAllowedLegacy_permits_coordinator_and_authority_statuses(string legacyStatus)
    {
        _sut.ValidateCommitAllowedLegacy(legacyStatus).IsAllowed.Should().BeTrue();
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
    public void DeriveStatusAfterResultSubmission_maps_to_ready_or_waiting()
    {
        List<AgentResult> complete =
        [
            NewResult(AgentType.Topology),
            NewResult(AgentType.Cost),
            NewResult(AgentType.Compliance),
            NewResult(AgentType.Critic)
        ];

        _sut.DeriveStatusAfterResultSubmission(complete).Should().Be(ArchitectureRunStatus.ReadyForCommit);
        _sut.DeriveStatusAfterResultSubmission([complete[0]]).Should().Be(ArchitectureRunStatus.WaitingForResults);
    }

    [Fact]
    public void ShouldSkipQueuedAuthorityPipelineCompletion_when_context_exists()
    {
        _sut.ShouldSkipQueuedAuthorityPipelineCompletion(Guid.NewGuid()).Should().BeTrue();
        _sut.ShouldSkipQueuedAuthorityPipelineCompletion(null).Should().BeFalse();
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
