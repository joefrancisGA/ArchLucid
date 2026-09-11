using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class FinalizeReadinessServiceTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task BuildAsync_blocks_when_transparency_trail_missing_on_finalize()
    {
        string runId = Guid.NewGuid().ToString("D");
        Guid runGuid = Guid.Parse(runId);

        Mock<IRunRepository> runs = CreateRunRepository(runId, runGuid, includeRequest: true);
        Mock<IPreFinalizeChecklistService> checklist = CreateChecklistMock(runId);

        FinalizeReadinessService sut = CreateSut(runs.Object, checklist.Object, transparencyTrail: null);

        FinalizeReadinessResult result = await sut.BuildAsync(runId, cancellationToken: CancellationToken.None);

        result.ReadyToFinalize.Should().BeFalse();
        result.BlockedReasonSummary.Should().Contain("transparency trail");
        result.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.CareerArtifact
            && block.Code == "transparency_trail_incomplete");
    }

    [Fact]
    public async Task BuildAsync_marks_not_ready_when_run_already_committed()
    {
        string runId = Guid.NewGuid().ToString("D");
        Guid runGuid = Guid.Parse(runId);

        Mock<IRunRepository> runs = CreateRunRepository(
            runId,
            runGuid,
            includeRequest: true,
            goldenManifestId: Guid.NewGuid());
        Mock<IPreFinalizeChecklistService> checklist = CreateChecklistMock(runId);

        FinalizeReadinessService sut = CreateSut(runs.Object, checklist.Object, transparencyTrail: new TransparencyTrail());

        FinalizeReadinessResult result = await sut.BuildAsync(runId, cancellationToken: CancellationToken.None);

        result.ReadyToFinalize.Should().BeFalse();
        result.Blocks.Should().ContainSingle(block => block.Code == "run_already_committed");
    }

    [Fact]
    public async Task BuildAsync_blocks_when_pre_commit_governance_gate_blocks()
    {
        string runId = Guid.NewGuid().ToString("D");
        Guid runGuid = Guid.Parse(runId);

        Mock<IRunRepository> runs = CreateRunRepository(runId, runGuid, includeRequest: true);
        Mock<IPreFinalizeChecklistService> checklist = CreateChecklistMock(runId);

        Mock<IPreCommitGovernanceGate> preCommitGate = new();
        preCommitGate
            .Setup(gate => gate.EvaluateAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PreCommitGateResult
            {
                Blocked = true,
                Reason = "Critical findings exceed policy pack threshold.",
                BlockingFindingIds = ["finding-1"],
            });

        FinalizeReadinessService sut = CreateSut(
            runs.Object,
            checklist.Object,
            transparencyTrail: new TransparencyTrail(),
            preCommitGate: preCommitGate.Object);

        FinalizeReadinessResult result = await sut.BuildAsync(runId, cancellationToken: CancellationToken.None);

        result.ReadyToFinalize.Should().BeFalse();
        result.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Governance
            && block.Code == "pre_commit_gate"
            && block.Message == "Critical findings exceed policy pack threshold.");
        preCommitGate.Verify(gate => gate.EvaluateAsync(runId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task BuildAsync_does_not_block_when_pre_commit_gate_warn_only()
    {
        string runId = Guid.NewGuid().ToString("D");
        Guid runGuid = Guid.Parse(runId);

        Mock<IRunRepository> runs = CreateRunRepository(runId, runGuid, includeRequest: true);
        Mock<IPreFinalizeChecklistService> checklist = CreateChecklistMock(runId);

        Mock<IPreCommitGovernanceGate> preCommitGate = new();
        preCommitGate
            .Setup(gate => gate.EvaluateAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PreCommitGateResult
            {
                Blocked = true,
                WarnOnly = true,
                Reason = "Findings meet threshold but severities are warn-only.",
                Warnings = ["Advisory only."],
            });

        FinalizeReadinessService sut = CreateSut(
            runs.Object,
            checklist.Object,
            transparencyTrail: new TransparencyTrail(),
            preCommitGate: preCommitGate.Object);

        FinalizeReadinessResult result = await sut.BuildAsync(runId, cancellationToken: CancellationToken.None);

        result.Blocks.Should().NotContain(block => block.Layer == FinalizeReadinessLayers.Governance);
    }

    private static Mock<IPreFinalizeChecklistService> CreateChecklistMock(string runId)
    {
        Mock<IPreFinalizeChecklistService> checklist = new();
        checklist
            .Setup(service => service.BuildAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PreFinalizeChecklistResult
            {
                RunId = runId,
                ReadyToFinalize = true,
                Items = [],
                AdvisoryCount = 0,
                BlockingCount = 0,
                PreCommitGateEnabled = true,
            });

        return checklist;
    }

    private static Mock<IRunRepository> CreateRunRepository(
        string runId,
        Guid runGuid,
        bool includeRequest,
        Guid? goldenManifestId = null)
    {
        Mock<IRunRepository> runs = new();
        runs
            .Setup(repository => repository.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                ArchitectureRequestId = includeRequest ? Guid.NewGuid().ToString("D") : null,
                FindingsSnapshotId = Guid.NewGuid(),
                GoldenManifestId = goldenManifestId,
                StructuralExecutionMode = StructuralExecutionMode.Real,
            });

        return runs;
    }

    private static FinalizeReadinessService CreateSut(
        IRunRepository runRepository,
        IPreFinalizeChecklistService checklistService,
        TransparencyTrail? transparencyTrail,
        IPreCommitGovernanceGate? preCommitGate = null)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(TestScope);

        Mock<IAgentTaskRepository> tasks = new();
        tasks
            .Setup(repository => repository.GetByRunIdAsync(TestScope, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(repository => repository.GetByIdAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((string id, CancellationToken _) => new ArchitectureRequest
            {
                RequestId = id,
                IntakeTransparencyTrail = transparencyTrail,
            });

        Mock<IFindingsSnapshotRepository> snapshots = new();
        snapshots
            .Setup(repository => repository.GetByIdAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new FindingsSnapshot
            {
                Findings = [],
                GenerationStatus = FindingsSnapshotGenerationStatus.Complete,
            });

        Mock<IFindingReviewTrailRepository> reviewTrail = new();
        reviewTrail
            .Setup(repository => repository.ListForFindingIdsSinceUtcAsync(
                It.IsAny<Guid>(),
                It.IsAny<IReadOnlyList<string>>(),
                It.IsAny<DateTimeOffset>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentExecutionTraceRepository> traces = new();
        traces
            .Setup(repository => repository.GetByRunIdAsync(TestScope, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRunStageOutcomesRepository> stageOutcomes = new();
        stageOutcomes
            .Setup(repository => repository.ListByRunIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IAgentOutputQualityGateOptionsResolver> qualityOptions = new();
        qualityOptions
            .Setup(resolver => resolver.Resolve(It.IsAny<CancellationToken>()))
            .Returns(new AgentOutputQualityGateOptions());

        Mock<IRunAssumptionAcknowledgementService> assumptionAcks = new();
        assumptionAcks
            .Setup(service => service.GetAcknowledgedIdsAsync(TestScope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HashSet<string>(StringComparer.Ordinal));

        Mock<IUserWorkspaceModeReader> workspaceMode = new();
        workspaceMode
            .Setup(reader => reader.IsWorkingDeskAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<IActorContext> actor = new();
        actor.Setup(context => context.GetActor()).Returns("operator@test");

        Mock<IPreCommitGovernanceGate> gate = new();
        gate
            .Setup(g => g.EvaluateAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(PreCommitGateResult.Allowed());

        return new FinalizeReadinessService(
            scopeProvider.Object,
            runRepository,
            tasks.Object,
            requests.Object,
            snapshots.Object,
            reviewTrail.Object,
            traces.Object,
            stageOutcomes.Object,
            qualityOptions.Object,
            assumptionAcks.Object,
            workspaceMode.Object,
            actor.Object,
            checklistService,
            preCommitGate ?? gate.Object,
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            Options.Create(new FinalizeQualityGateOptions { Enabled = true }));
    }
}
