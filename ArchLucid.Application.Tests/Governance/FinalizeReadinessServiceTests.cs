using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

using System.Text.Json;

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

    [Fact]
    public async Task BuildAsync_aligns_embedded_checklist_ready_flag_with_commit_authority_when_checklist_disagrees()
    {
        string runId = Guid.NewGuid().ToString("D");
        Guid runGuid = Guid.Parse(runId);

        Mock<IRunRepository> runs = CreateRunRepository(runId, runGuid, includeRequest: true);
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
        result.Checklist.ReadyToFinalize.Should().BeFalse();
        result.Checklist.ReadyToFinalize.Should().Be(result.ReadyToFinalize);
    }

    [Fact]
    public async Task BuildAsync_includes_block_explanation_on_pre_commit_gate_when_explainer_enabled()
    {
        string runId = Guid.NewGuid().ToString("D");
        Guid runGuid = Guid.Parse(runId);

        Mock<IRunRepository> runs = CreateRunRepository(runId, runGuid, includeRequest: true);
        Mock<IPreFinalizeChecklistService> checklist = CreateChecklistMock(runId);

        Mock<IPreCommitGovernanceGate> preCommitGate = new();
        PreCommitGateResult blockedResult = new()
        {
            Blocked = true,
            Reason = "Critical findings exceed policy pack threshold.",
            BlockingFindingIds = ["finding-1"],
            PolicyPackId = "pack-1",
        };

        preCommitGate
            .Setup(gate => gate.EvaluateAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(blockedResult);

        Mock<IPreCommitGovernanceBlockExplainer> blockExplainer = new();
        blockExplainer
            .Setup(explainer => explainer.ExplainAsync(
                blockedResult,
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("Add a private endpoint before finalizing.");

        FinalizeReadinessService sut = CreateSut(
            runs.Object,
            checklist.Object,
            transparencyTrail: new TransparencyTrail(),
            preCommitGate: preCommitGate.Object,
            preCommitGovernanceBlockExplainer: blockExplainer.Object,
            explainGovernanceBlocksEnabled: true);

        FinalizeReadinessResult result = await sut.BuildAsync(runId, cancellationToken: CancellationToken.None);

        result.Blocks.Should().ContainSingle(block =>
            block.Code == "pre_commit_gate"
            && block.Layer == FinalizeReadinessLayers.Governance
            && block.BlockExplanation == "Add a private endpoint before finalizing.");
    }

    [Fact]
    public void AlignChecklistWithCommitAuthority_returns_same_instance_when_flags_already_match()
    {
        PreFinalizeChecklistResult checklist = new()
        {
            RunId = Guid.NewGuid().ToString("D"),
            ReadyToFinalize = false,
            Items = [],
        };

        PreFinalizeChecklistResult aligned =
            FinalizeReadinessService.AlignChecklistWithCommitAuthority(checklist, commitAuthorityReady: false);

        aligned.Should().BeSameAs(checklist);
    }

    [Fact]
    public async Task BuildAsync_blocks_when_evidence_referential_integrity_fails()
    {
        string runId = Guid.NewGuid().ToString("D");
        Guid runGuid = Guid.Parse(runId);
        Guid pinnedPackageId = Guid.Parse("22222222-2222-2222-2222-222222222222");

        PinnedEvidencePackageRow[] pinRows = [new("unit-proof", pinnedPackageId, DateTime.UtcNow)];
        string pinJson = JsonSerializer.Serialize(pinRows, ContractJson.CamelCaseIgnoreNullCompact);

        Mock<IRunRepository> runs = CreateRunRepository(
            runId,
            runGuid,
            includeRequest: true,
            pinnedEvidencePackagePinsJson: pinJson);
        Mock<IPreFinalizeChecklistService> checklist = CreateChecklistMock(runId);

        FindingsSnapshot findingsSnapshot = new()
        {
            Findings =
            [
                new Finding
                {
                    FindingId = "unit-evidence-integrity-proof",
                    FindingType = "ArchitectureFinding",
                    Category = "Security",
                    EngineType = "unit-proof",
                    Severity = FindingSeverity.Critical,
                    Title = "Critical finding without resolvable evidence linkage.",
                    Rationale = "Pinned for evidence referential integrity unit proof.",
                    RunIdRef = runId,
                    Trace = new ExplainabilityTrace(),
                },
            ],
            GenerationStatus = FindingsSnapshotGenerationStatus.Complete,
        };

        FinalizeReadinessService sut = CreateSut(
            runs.Object,
            checklist.Object,
            transparencyTrail: new TransparencyTrail(),
            findingsSnapshot: findingsSnapshot);

        FinalizeReadinessResult result = await sut.BuildAsync(runId, cancellationToken: CancellationToken.None);

        result.ReadyToFinalize.Should().BeFalse();
        result.BlockedReasonSummary.Should().Contain("finding evidence referential integrity failed");
        result.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "evidence_referential_integrity");
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

    [Fact]
    public async Task BuildAsync_blocks_when_architecture_version_pin_drift_detected()
    {
        string runId = Guid.NewGuid().ToString("D");
        Guid runGuid = Guid.Parse(runId);
        Guid versionId = Guid.NewGuid();
        string requestId = Guid.NewGuid().ToString("D");
        ArchitectureRequest request = new()
        {
            RequestId = requestId,
            IntakeTransparencyTrail = new TransparencyTrail(),
        };
        byte[] versionHash = ArchitectureVersionContentFingerprint.ComputeArtifactHash(request, knowledgeModel: null);
        byte[] driftedPinnedHash = new byte[versionHash.Length];
        versionHash.CopyTo(driftedPinnedHash, 0);
        driftedPinnedHash[0] = (byte)(driftedPinnedHash[0] == 0xFF ? (byte)0x00 : (byte)0xFF);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(repository => repository.GetByIdAsync(TestScope, runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                ArchitectureRequestId = requestId,
                FindingsSnapshotId = Guid.NewGuid(),
                StructuralExecutionMode = StructuralExecutionMode.Real,
                ArchitectureVersionId = versionId,
                PinnedArchitectureVersionContentHashSha256 = driftedPinnedHash,
            });
        Mock<IPreFinalizeChecklistService> checklist = CreateChecklistMock(runId);

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(repository => repository.GetByIdAsync(requestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IArchitectureVersionRepository> architectureVersions = new();
        architectureVersions
            .Setup(repository => repository.GetByIdAsync(TestScope, versionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ArchitectureVersionRecord
            {
                ArchitectureVersionId = versionId,
                ContentHashSha256 = versionHash,
            });

        FinalizeReadinessService sut = CreateSut(
            runs.Object,
            checklist.Object,
            transparencyTrail: new TransparencyTrail(),
            architectureVersionRepository: architectureVersions.Object,
            architectureRequestRepository: requests.Object);

        FinalizeReadinessResult result = await sut.BuildAsync(runId, cancellationToken: CancellationToken.None);

        result.ReadyToFinalize.Should().BeFalse();
        result.Blocks.Should().Contain(block =>
            block.Layer == FinalizeReadinessLayers.Integrity
            && block.Code == "architecture_version_pin"
            && block.Message.Contains("drifted since run create", StringComparison.Ordinal));
    }

    private static Mock<IRunRepository> CreateRunRepository(
        string runId,
        Guid runGuid,
        bool includeRequest,
        Guid? goldenManifestId = null,
        string? pinnedEvidencePackagePinsJson = null,
        Guid? architectureVersionId = null,
        byte[]? pinnedArchitectureVersionContentHashSha256 = null)
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
                PinnedEvidencePackagePinsJson = pinnedEvidencePackagePinsJson,
                ArchitectureVersionId = architectureVersionId,
                PinnedArchitectureVersionContentHashSha256 = pinnedArchitectureVersionContentHashSha256,
            });

        return runs;
    }

    private static FinalizeReadinessService CreateSut(
        IRunRepository runRepository,
        IPreFinalizeChecklistService checklistService,
        TransparencyTrail? transparencyTrail,
        IPreCommitGovernanceGate? preCommitGate = null,
        FindingsSnapshot? findingsSnapshot = null,
        IArchitectureVersionRepository? architectureVersionRepository = null,
        IArchitectureRequestRepository? architectureRequestRepository = null,
        IPreCommitGovernanceBlockExplainer? preCommitGovernanceBlockExplainer = null,
        bool explainGovernanceBlocksEnabled = false)
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
            .ReturnsAsync(findingsSnapshot ?? new FindingsSnapshot
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

        Mock<IRunPolicyPackPinService> policyPackPins = new();
        policyPackPins
            .Setup(service => service.VerifyPinIntegrityOrThrowAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRunEvidencePackagePinService> evidencePackagePins = new();
        evidencePackagePins
            .Setup(service => service.VerifyPinIntegrityOrThrowAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<ScopeContext>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureKnowledgeModelAccess> knowledgeModelAccess = new();
        knowledgeModelAccess
            .Setup(access => access.GetForRunAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((Contracts.ArchitectureIntelligence.ArchitectureKnowledgeModel?)null);

        Mock<IDraftRequestRepository> drafts = new();
        drafts
            .Setup(repository => repository.GetBySpawnedRunIdAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((DraftRequestResponse?)null);

        Mock<IArchitectureVersionRepository> architectureVersions = new();
        architectureVersions
            .Setup(repository => repository.GetByIdAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureVersionRecord?)null);

        Mock<IPreCommitGovernanceBlockExplainer> blockExplainerMock = new();
        blockExplainerMock
            .Setup(explainer => explainer.ExplainAsync(
                It.IsAny<PreCommitGateResult>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((string?)null);

        IPreCommitGovernanceBlockExplainer blockExplainer =
            preCommitGovernanceBlockExplainer ?? blockExplainerMock.Object;

        return new FinalizeReadinessService(
            scopeProvider.Object,
            runRepository,
            tasks.Object,
            architectureRequestRepository ?? requests.Object,
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
            policyPackPins.Object,
            evidencePackagePins.Object,
            knowledgeModelAccess.Object,
            drafts.Object,
            architectureVersionRepository ?? architectureVersions.Object,
            blockExplainer,
            Options.Create(new PreCommitGovernanceGateOptions { PreCommitGateEnabled = true }),
            Options.Create(new FinalizeQualityGateOptions { Enabled = true }),
            Options.Create(new ExplainGovernanceBlocksOptions { Enabled = explainGovernanceBlocksEnabled }),
            Mock.Of<Microsoft.Extensions.Logging.ILogger<FinalizeReadinessService>>());
    }
}
