using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AuthorityAnalysisBudgetTests
{
    [Fact]
    public async Task Findings_timeout_blocks_decisioning_and_artifacts_and_records_terminal_timeline()
    {
        FakeTimeProvider clock = new();
        AnalysisStageExecutionOptions options = new() { StageTimeoutSeconds = { ["authority.findings"] = 2 } };
        using AnalysisExecutionBudget budget = new(options, clock, TimeSpan.FromMinutes(1), CancellationToken.None);
        Mock<IAuthorityPipelineFindingsStage> findings = new();
        findings.Setup(stage => stage.ExecuteAsync(It.IsAny<AuthorityPipelineContext>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                clock.Advance(TimeSpan.FromSeconds(2));

                return Task.CompletedTask;
            });
        Mock<IAuthorityPipelineDecisioningStage> decisioning = new();
        Mock<IAuthorityPipelineArtifactsStage> artifacts = new();
        Mock<IRunStageOutcomesRepository> outcomes = new();
        AuthorityPipelineStageContextHydrator hydrator = new(
            Mock.Of<IContextSnapshotRepository>(), Mock.Of<IGraphSnapshotRepository>(),
            Mock.Of<IFindingsSnapshotRepository>(), Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IGoldenManifestRepository>(), Mock.Of<IArtifactBundleRepository>());
        AuthorityPipelineStagesExecutor executor = new(
            Mock.Of<IAuthorityPipelineContextIngestionStage>(), Mock.Of<IAuthorityPipelineGraphStage>(),
            findings.Object, decisioning.Object, artifacts.Object, hydrator, Mock.Of<IRunGovernanceScopePinService>(),
            outcomes.Object, NullLogger<AuthorityPipelineStagesExecutor>.Instance, timeProvider: clock);
        AuthorityPipelineContext context = new()
        {
            Run = new RunRecord { RunId = Guid.NewGuid() },
            Request = new ContextIngestionRequest(),
            Scope = new ScopeContext(),
            UnitOfWork = Mock.Of<IArchLucidUnitOfWork>(),
            ExecutionBudget = budget,
        };

        AnalysisStageExecutionException failure = await Assert.ThrowsAsync<AnalysisStageExecutionException>(() =>
            executor.ExecuteAfterRunPersistedAsync(context, budget.Token));

        Assert.Equal(AnalysisStageOutcome.TimedOut, failure.Outcome);
        Assert.Equal("authority.findings", failure.Stage);
        Assert.Single(findings.Invocations);
        Assert.Empty(decisioning.Invocations);
        Assert.Empty(artifacts.Invocations);
        Assert.Equal(
            [AnalysisStageOutcome.Succeeded, AnalysisStageOutcome.Succeeded, AnalysisStageOutcome.TimedOut,
                AnalysisStageOutcome.NotStarted, AnalysisStageOutcome.NotStarted],
            context.TerminalStageTimeline.Select(stage => stage.OutcomeStatus).ToArray());
        outcomes.Verify(repo => repo.RecordStageCompletedAsync(context.Run.RunId, "findings",
            AnalysisStageOutcome.TimedOut, It.IsAny<DateTime>(), It.IsAny<CancellationToken>(), null, null), Times.Once);
    }
}
