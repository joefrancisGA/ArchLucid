using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunEngineProvenanceCaptureServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task CompareQuality_TryCaptureAndPersistAsync_merges_execution_traces_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("51515151-5151-5151-5151-515151515151");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        RunRecord header = new()
        {
            RunId = runGuid,
            TenantId = Scope.TenantId,
            WorkspaceId = Scope.WorkspaceId,
            ScopeProjectId = Scope.ProjectId,
            StructuralExecutionMode = StructuralExecutionMode.Simulator,
        };

        List<AgentExecutionTrace> legacyTraces =
        [
            new AgentExecutionTrace
            {
                TraceId = "trace-legacy-1",
                RunId = legacyUpper,
                ModelDeploymentName = AgentExecutionTraceModelMetadata.SimulatorDeploymentName,
                InputTokenCount = 250,
                OutputTokenCount = 50,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
        ];

        Mock<IRunRepository> runs = new();
        runs.Setup(r => r.GetByIdAsync(Scope, runGuid, It.IsAny<CancellationToken>())).ReturnsAsync(header);
        runs
            .Setup(r => r.UpdateAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask)
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (record, _, _, _) => header.EngineProvenanceJson = record.EngineProvenanceJson);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(Scope);

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(r => r.GetByRunIdAsync(Scope, canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        traces
            .Setup(r => r.GetByRunIdAsync(Scope, legacyUpper, It.IsAny<CancellationToken>()))
            .ReturnsAsync(legacyTraces);
        traces
            .Setup(r => r.GetByRunIdAsync(
                Scope,
                It.Is<string>(id => id != canonicalRunId && id != legacyUpper),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<ILlmCostEstimator> costEstimator = new();
        costEstimator
            .Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<string?>()))
            .Returns(1.25m);

        RunEngineProvenanceCaptureService sut = new(
            runs.Object,
            scopeProvider.Object,
            traces.Object,
            Mock.Of<IFindingsSnapshotRepository>(),
            costEstimator.Object);

        AgentEvidencePackage evidence = new()
        {
            EvidencePackageId = "pkg-1",
            RunId = canonicalRunId,
            RequestId = "req-1",
        };

        await sut.TryCaptureAndPersistAsync(canonicalRunId, evidence, CancellationToken.None);

        header.EngineProvenanceJson.Should().NotBeNullOrWhiteSpace();
        ReviewRunEngineProvenance? provenance = ReviewRunEngineProvenanceJson.TryDeserialize(header.EngineProvenanceJson);
        provenance.Should().NotBeNull();
        provenance!.TotalInputTokens.Should().Be(250);
    }
}
