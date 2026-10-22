using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RunKernelCompletenessTests
{
    private readonly RunStateTransitionService _transitions = new();

    [Fact]
    public void AgentTaskLoopComplete_is_true_for_ReadyForCommit_with_four_commit_ready_agents()
    {
        bool complete = RunKernelCompleteness.IsAgentTaskLoopComplete(
            _transitions,
            ArchitectureRunStatus.ReadyForCommit,
            CommitReadySet());

        complete.Should().BeTrue();
    }

    [Fact]
    public void AgentTaskLoopComplete_is_false_when_status_is_not_ReadyForCommit()
    {
        bool complete = RunKernelCompleteness.IsAgentTaskLoopComplete(
            _transitions,
            ArchitectureRunStatus.Committed,
            CommitReadySet());

        complete.Should().BeFalse();
    }

    [Fact]
    public void AuthorityPipelineComplete_requires_all_stages_succeeded_and_golden_pointer()
    {
        Guid manifestId = Guid.NewGuid();
        IReadOnlyList<StageTimelineSummary> stages = SucceededStages();

        RunKernelCompleteness.IsAuthorityPipelineComplete(manifestId, manifest: null, stages).Should().BeTrue();
        RunKernelCompleteness.IsAuthorityPipelineComplete(null, new GoldenManifest { RunId = "r" }, stages).Should().BeTrue();
        RunKernelCompleteness.IsAuthorityPipelineComplete(manifestId, manifest: null, []).Should().BeFalse();
        RunKernelCompleteness.IsAuthorityPipelineComplete(null, manifest: null, stages).Should().BeFalse();
    }

    [Fact]
    public void AgentTaskLoopComplete_without_authority_stages_does_not_imply_authority_complete()
    {
        bool agentTask = RunKernelCompleteness.IsAgentTaskLoopComplete(
            _transitions,
            ArchitectureRunStatus.ReadyForCommit,
            CommitReadySet());
        bool authority = RunKernelCompleteness.IsAuthorityPipelineComplete(null, manifest: null, []);

        agentTask.Should().BeTrue();
        authority.Should().BeFalse();
    }

    private static IReadOnlyList<StageTimelineSummary> SucceededStages()
    {
        DateTime started = new(2026, 8, 18, 0, 0, 0, DateTimeKind.Utc);

        return AuthorityPipelineStageNames.Sequence
            .Select(name => StageTimelineSummary.FromRow(
                name,
                started,
                started.AddMinutes(1),
                AuthorityPipelineStageNames.SucceededOutcomeStatus))
            .ToList();
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
        return new AgentResult
        {
            ResultId = Guid.NewGuid().ToString("N"),
            RunId = Guid.NewGuid().ToString("N"),
            TaskId = Guid.NewGuid().ToString("N"),
            AgentType = agentType,
            Claims = ["ok"],
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };
    }
}
