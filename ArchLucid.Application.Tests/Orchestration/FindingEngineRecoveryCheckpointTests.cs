using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.Application.Runs.Orchestration.Pipeline.Stages;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Artifacts;
using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Repositories;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingEngineRecoveryCheckpointTests
{
    [Theory]
    [InlineData(0, RequirementComparisonRecoveryCodes.NoFindings, "completed with no findings", 1)]
    [InlineData(1, RequirementComparisonRecoveryCodes.RecoveredNoFindings, "recovered after a retry", 2)]
    [InlineData(2, RequirementComparisonRecoveryCodes.RetryExhausted, "exhausted its retry budget", 2)]
    public async Task Requirement_read_outcome_survives_scoped_findings_checkpoint_without_reinvocation(
        int transientFailures, string expectedCode, string expectedNote, int expectedReads)
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);
        Guid runId = Guid.NewGuid();
        Guid priorId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        GraphSnapshot prior = new()
        {
            GraphSnapshotId = priorId,
            Nodes = [new() { NodeId = "prior-context", NodeType = "ContextSnapshot", Label = "Prior context" }],
        };
        GraphSnapshot current = new() { GraphSnapshotId = Guid.NewGuid(), RunId = runId, ContextSnapshotId = contextId };
        Mock<IGraphSnapshotRepository> graphs = new(MockBehavior.Strict);
        int reads = 0;
        graphs.Setup(r => r.GetByIdAsync(scope, priorId, It.IsAny<CancellationToken>()))
            .Returns(() => ++reads <= transientFailures
                ? Task.FromException<GraphSnapshot?>(new TimeoutException("Private provider diagnostic"))
                : Task.FromResult<GraphSnapshot?>(prior));
        RequirementCrossRunDiffFindingEngine comparison = new(graphs.Object, scopeProvider.Object);
        Mock<IFindingEngine> sibling = new(MockBehavior.Strict);
        sibling.SetupGet(engine => engine.EngineType).Returns("requirement-baseline");
        sibling.SetupGet(engine => engine.Category).Returns("Requirement");
        sibling.Setup(engine => engine.AnalyzeAsync(current, It.IsAny<FindingAnalysisContext?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new Finding
            {
                FindingId = "sibling-1", EngineType = "requirement-baseline", Category = "Requirement",
                FindingType = "RequirementFinding", Title = "Independent evidence", Rationale = "Recorded once.",
                Severity = FindingSeverity.Info,
            }]);
        FindingsEngineInvokeStage invoke = new([comparison, sibling.Object], Mock.Of<IFindingPayloadValidator>(),
            NullLogger<FindingsEngineInvokeStage>.Instance);
        FindingsStageContext stage = new()
        {
            RunId = runId, ContextSnapshotId = contextId, GraphSnapshot = current,
            AnalysisContext = new FindingAnalysisContext
            {
                Prior = new PriorReviewSnapshots { PriorRunId = Guid.NewGuid(), PriorGraphSnapshotId = priorId },
            },
        };
        await invoke.ExecuteAsync(stage, CancellationToken.None);
        stage.DedupedFindingsCount = stage.AllFindings.Count;
        stage.Snapshot = new FindingsSnapshot
        {
            FindingsSnapshotId = Guid.NewGuid(), RunId = runId, GraphSnapshotId = current.GraphSnapshotId,
            ContextSnapshotId = contextId, Findings = stage.AllFindings, EngineFailures = stage.EngineFailures,
        };
        FindingsSnapshot emitted = await new FindingsSnapshotEmitStage(NullLogger<FindingsSnapshotEmitStage>.Instance)
            .ExecuteAsync(stage, CancellationToken.None);
        emitted.RequirementComparisonRecovery.Should().Be(expectedCode);
        emitted.EngineFailures.Should().HaveCount(transientFailures == 2 ? 1 : 0);

        InMemoryFindingsSnapshotRepository stored = new(scopeProvider.Object);
        await stored.SaveAsync(emitted, CancellationToken.None);
        ScopeContext otherProject = new()
        {
            TenantId = scope.TenantId, WorkspaceId = scope.WorkspaceId, ProjectId = Guid.NewGuid(),
        };
        (await stored.GetByIdAsync(otherProject, emitted.FindingsSnapshotId, CancellationToken.None)).Should().BeNull();
        AuthorityPipelineStageContextHydrator hydrator = new(Mock.Of<IContextSnapshotRepository>(),
            Mock.Of<IGraphSnapshotRepository>(), stored, Mock.Of<IDecisionTraceRepository>(),
            Mock.Of<IGoldenManifestRepository>(), Mock.Of<IArtifactBundleRepository>());
        Mock<IAuthorityPipelineFindingsStage> resumedFindings = new(MockBehavior.Strict);
        Mock<IRunGovernanceScopePinService> governance = new();
        governance.Setup(s => s.BeginRestoredScope(It.IsAny<RunRecord>())).Returns(Mock.Of<IDisposable>());
        AuthorityPipelineStagesExecutor resumed = new(Mock.Of<IAuthorityPipelineContextIngestionStage>(),
            Mock.Of<IAuthorityPipelineGraphStage>(), resumedFindings.Object, Mock.Of<IAuthorityPipelineDecisioningStage>(),
            Mock.Of<IAuthorityPipelineArtifactsStage>(), hydrator, governance.Object,
            Mock.Of<IRunStageOutcomesRepository>(), NullLogger<AuthorityPipelineStagesExecutor>.Instance);
        AuthorityPipelineContext ctx = new()
        {
            Run = new RunRecord { RunId = runId, FindingsSnapshotId = emitted.FindingsSnapshotId },
            Scope = scope, UnitOfWork = Mock.Of<IArchLucidUnitOfWork>(), Request = new ContextIngestionRequest(),
        };
        await resumed.ExecuteAfterRunPersistedAsync(ctx, CancellationToken.None);

        ctx.FindingsSnapshot.Should().NotBeSameAs(emitted);
        ctx.FindingsSnapshot!.Findings.Select(f => f.FindingId).Should().Equal("sibling-1");
        resumedFindings.VerifyNoOtherCalls();
        reads.Should().Be(expectedReads);
        sibling.Verify(engine => engine.AnalyzeAsync(current, It.IsAny<FindingAnalysisContext?>(), It.IsAny<CancellationToken>()), Times.Once);
        RunFindingCoverageProjection.Build(ctx.FindingsSnapshot).Summary!.FindingEngineRecoveryNote
            .Should().Contain(expectedNote).And.NotContain("Private provider diagnostic");
    }
}
