using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PreFinalizeChecklistServiceTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task BuildAsync_marks_not_ready_when_assumed_technology_rows_exist()
    {
        string runId = Guid.NewGuid().ToString("D");

        Mock<ITechnologyLedgerRepository> ledger = new();
        ledger
            .Setup(l => l.GetByRunIdAsync(TestScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([
                new TechnologyLedgerEntry
                {
                    RunId = runId,
                    Status = TechnologyLedgerStatus.Assumed,
                    TechnologyName = "Azure SQL",
                },
            ]);

        PreFinalizeChecklistService sut = CreateSut(ledger: ledger.Object);

        PreFinalizeChecklistResult result = await sut.BuildAsync(runId, CancellationToken.None);

        result.ReadyToFinalize.Should().BeFalse();
        result.Items.Should().Contain(item =>
            item.ItemId == "technology-baseline-assumed"
            && item.Status == PreFinalizeChecklistItemStatus.Blocking
            && item.Count == 1);
    }

    [Fact]
    public async Task BuildAsync_flags_evidence_linkage_gaps_as_advisory()
    {
        string runId = Guid.NewGuid().ToString("D");
        Finding criticalFinding = new()
        {
            FindingId = "finding-1",
            FindingType = "Security",
            Category = "Security",
            EngineType = "Test",
            Severity = FindingSeverity.Critical,
            Title = "Missing encryption",
            Rationale = "Data at rest is unencrypted.",
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = Guid.Parse(runId),
                FindingsSnapshotId = Guid.NewGuid(),
            });

        Mock<IFindingsSnapshotRepository> snapshots = new();
        snapshots
            .Setup(s => s.GetByIdAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingsSnapshot { Findings = [criticalFinding] });

        Mock<IFindingEvidenceLinkageFindingEngine> linkage = new();
        linkage
            .Setup(e => e.Evaluate(runId, It.IsAny<IReadOnlyList<Finding>>()))
            .Returns([new Finding { FindingId = "gap-1", Severity = FindingSeverity.Warning }]);

        PreFinalizeChecklistService sut = CreateSut(
            runRepository: runs.Object,
            findingsSnapshotRepository: snapshots.Object,
            linkageEngine: linkage.Object);

        PreFinalizeChecklistResult result = await sut.BuildAsync(runId, CancellationToken.None);

        result.Items.Should().Contain(item =>
            item.ItemId == "evidence-linkage-gaps"
            && item.Status == PreFinalizeChecklistItemStatus.Advisory
            && item.Count == 1);
    }

    [Fact]
    public async Task BuildAsync_does_not_persist_governance_scope_json_on_read()
    {
        Guid runKey = Guid.NewGuid();
        string runId = runKey.ToString("D");
        string originalScopeJson = """{"assignments":[{"packId":"pack-1","outcomes":[]}]}""";

        RunRecord run = new()
        {
            RunId = runKey,
            GovernanceScopeJson = originalScopeJson,
        };

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(TestScope, runKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(run);

        Mock<IFindingsSnapshotRepository> snapshots = new();
        snapshots
            .Setup(s => s.GetByIdAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((FindingsSnapshot?)null);

        PreFinalizeChecklistService sut = CreateSut(
            runRepository: runs.Object,
            findingsSnapshotRepository: snapshots.Object);

        await sut.BuildAsync(runId, CancellationToken.None);

        run.GovernanceScopeJson.Should().Be(originalScopeJson);
        runs.Verify(
            r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task BuildAsync_returns_not_ready_when_run_is_out_of_scope()
    {
        Guid runKey = Guid.NewGuid();
        string runId = runKey.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(TestScope, runKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        PreFinalizeChecklistService sut = CreateSut(runRepository: runs.Object);

        PreFinalizeChecklistResult result = await sut.BuildAsync(runId, CancellationToken.None);

        result.ReadyToFinalize.Should().BeFalse();
        result.BlockingCount.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task BuildAsync_returns_not_ready_for_non_guid_run_id()
    {
        PreFinalizeChecklistService sut = CreateSut();

        PreFinalizeChecklistResult result = await sut.BuildAsync("not-a-guid", CancellationToken.None);

        result.ReadyToFinalize.Should().BeFalse();
    }

    [Fact]
    public async Task BuildAsync_marks_provisional_synthesis_as_advisory()
    {
        Guid runKey = Guid.NewGuid();

        Mock<IArchitectureKnowledgeModelAccess> knowledgeModelAccess = new();
        knowledgeModelAccess
            .Setup(k => k.GetForRunAsync(TestScope, runKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureKnowledgeModel
            {
                ModelId = "model-1",
                TenantId = TestScope.TenantId.ToString("D"),
                RunId = runKey.ToString("D"),
                IsProvisionalSynthesis = true,
                Elements =
                [
                    new ArchitectureModelElement
                    {
                        ElementId = "q-1",
                        Kind = ArchitectureElementKind.UnresolvedQuestion,
                        Name = "Data residency",
                    },
                ],
            });

        PreFinalizeChecklistService sut = CreateSut(knowledgeModelAccess: knowledgeModelAccess.Object);

        PreFinalizeChecklistResult result = await sut.BuildAsync(runKey.ToString("D"), CancellationToken.None);

        result.Items.Should().Contain(item =>
            item.ItemId == "provisional-synthesis"
            && item.Status == PreFinalizeChecklistItemStatus.Advisory
            && item.Count == 1);
    }

    [Fact]
    public async Task BuildAsync_marks_not_ready_when_pre_commit_gate_is_disabled()
    {
        Guid runKey = Guid.NewGuid();
        string runId = runKey.ToString("D");

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(TestScope, runKey, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { RunId = runKey });

        PreFinalizeChecklistService sut = CreateSut(
            runRepository: runs.Object,
            gateOptions: Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = false }));

        PreFinalizeChecklistResult result = await sut.BuildAsync(runId, CancellationToken.None);

        result.ReadyToFinalize.Should().BeFalse();
        result.PreCommitGateEnabled.Should().BeFalse();
        result.Items.Should().Contain(item =>
            item.ItemId == "pre-commit-gate"
            && item.Status == PreFinalizeChecklistItemStatus.Blocking);
    }

    private static PreFinalizeChecklistService CreateSut(
        IRunRepository? runRepository = null,
        IFindingsSnapshotRepository? findingsSnapshotRepository = null,
        ITechnologyLedgerRepository? ledger = null,
        IFindingEvidenceLinkageFindingEngine? linkageEngine = null,
        IPreCommitGovernanceGate? gate = null,
        IOptions<PreCommitGovernanceGateOptions>? gateOptions = null,
        IArchitectureKnowledgeModelAccess? knowledgeModelAccess = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);

        Mock<ITechnologyLedgerRepository> ledgerMock = new();
        ledgerMock
            .Setup(l => l.GetByRunIdAsync(TestScope, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRunRepository> runMock = new();
        runMock
            .Setup(r => r.GetByIdAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((ScopeContext scope, Guid runKey, CancellationToken _) =>
                new RunRecord { RunId = runKey });

        Mock<IPreCommitGovernanceGate> gateMock = new();
        gateMock
            .Setup(g => g.EvaluateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PreCommitGateResult.Allowed());

        Mock<IFindingEvidenceLinkageFindingEngine> linkageMock = new();
        linkageMock
            .Setup(e => e.Evaluate(It.IsAny<string>(), It.IsAny<IReadOnlyList<Finding>>()))
            .Returns([]);

        return new PreFinalizeChecklistService(
            scopeProvider.Object,
            runRepository ?? runMock.Object,
            Mock.Of<IArchitectureRequestRepository>(),
            findingsSnapshotRepository ?? Mock.Of<IFindingsSnapshotRepository>(),
            ledger ?? ledgerMock.Object,
            linkageEngine ?? linkageMock.Object,
            Options.Create(new FindingEvidenceLinkageFindingEngineOptions { Enabled = true }),
            gate ?? gateMock.Object,
            gateOptions ?? Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            new PreFinalizeExecuteBaselineDriftEvaluator(
                Mock.Of<IEffectiveGovernanceResolver>(),
                new EffectiveGovernanceSnapshotBuilder(),
                Mock.Of<IPolicyPackAssignmentRepository>(),
                Mock.Of<IPolicyPackRepository>(),
                Mock.Of<IPolicyPackVersionRepository>()),
            knowledgeModelAccess);
    }
}
