using ArchLucid.Application.Analysis;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Execute;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration.Execute;

[Trait("Category", "Unit")]
public sealed class ArchitectureRunExecuteScopeResolveStageTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_ThrowIfAuthorityPipelineCompleteAsync_blocks_execute_when_results_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("51515151-5151-5151-5151-515151515151");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();
        Guid manifestId = Guid.Parse("99999999-9999-9999-9999-999999999999");

        ArchitectureRun run = new()
        {
            RunId = canonicalRunId,
            Status = ArchitectureRunStatus.ReadyForCommit,
            GoldenManifestId = manifestId,
        };

        List<AgentResult> legacyResults = CommitReadySet(legacyUpper);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(Scope);

        Mock<IAgentResultRepository> results = new();
        results
            .Setup(r => r.GetByRunIdAsync(Scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        results
            .Setup(r => r.GetByRunIdAsync(Scope, legacyUpper, It.IsAny<CancellationToken>()))
            .ReturnsAsync(legacyResults);
        results
            .Setup(r => r.GetByRunIdAsync(
                Scope,
                It.Is<string>(id => id != canonicalRunId && id != legacyUpper),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRunStageOutcomesRepository> stages = new();
        stages
            .Setup(r => r.ListByRunIdAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(SucceededAuthorityStages());

        ArchitectureRunExecuteScopeResolveStage sut = new(
            scopeProvider.Object,
            results.Object,
            new RunStateTransitionService(),
            stages.Object);

        Func<Task> act = () => sut.ThrowIfAuthorityPipelineCompleteAsync(run, canonicalRunId, CancellationToken.None);

        ConflictException thrown = (await act.Should().ThrowAsync<ConflictException>()).Which;
        thrown.Message.Should().Contain("authority-pipeline complete");
    }

    private static IReadOnlyList<StageTimelineSummary> SucceededAuthorityStages()
    {
        DateTime started = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        return AuthorityPipelineStageNames.Sequence
            .Select(name => StageTimelineSummary.FromRow(
                name,
                started,
                started.AddMinutes(1),
                AuthorityPipelineStageNames.SucceededOutcomeStatus))
            .ToList();
    }

    private static List<AgentResult> CommitReadySet(string runId)
    {
        return
        [
            CommitReady(AgentType.Topology, runId),
            CommitReady(AgentType.Cost, runId),
            CommitReady(AgentType.Compliance, runId),
            CommitReady(AgentType.Critic, runId),
        ];
    }

    private static AgentResult CommitReady(AgentType agentType, string runId)
    {
        return new AgentResult
        {
            ResultId = Guid.NewGuid().ToString("N"),
            RunId = runId,
            TaskId = Guid.NewGuid().ToString("N"),
            AgentType = agentType,
            Claims = ["ok"],
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
        };
    }
}
