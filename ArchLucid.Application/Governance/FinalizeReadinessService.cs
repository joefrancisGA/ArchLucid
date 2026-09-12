using ArchLucid.Application.Common;
using ArchLucid.Application.Exports;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.UserPreferences;
using ArchLucid.Decisioning.CareerArtifacts;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Read-model composition of finalize gates documented in
///     <c>CommitOutputIntegrityGateMapArchitectureTests</c> — reuses the same evaluators as commit without
///     building a manifest or persisting state.
/// </summary>
public sealed class FinalizeReadinessService(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IAgentTaskRepository taskRepository,
    IArchitectureRequestRepository architectureRequestRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IRunStageOutcomesRepository runStageOutcomesRepository,
    IAgentOutputQualityGateOptionsResolver qualityGateOptionsResolver,
    IRunAssumptionAcknowledgementService runAssumptionAcknowledgementService,
    IUserWorkspaceModeReader userWorkspaceModeReader,
    IActorContext actorContext,
    IPreFinalizeChecklistService preFinalizeChecklistService,
    IPreCommitGovernanceGate preCommitGovernanceGate,
    IRunPolicyPackPinService runPolicyPackPinService,
    IRunEvidencePackagePinService runEvidencePackagePinService,
    IArchitectureKnowledgeModelAccess architectureKnowledgeModelAccess,
    IDraftRequestRepository draftRequestRepository,
    IArchitectureVersionRepository architectureVersionRepository,
    IPreCommitGovernanceBlockExplainer preCommitGovernanceBlockExplainer,
    IOptions<PreCommitGovernanceGateOptions> preCommitGovernanceGateOptions,
    IOptions<FinalizeQualityGateOptions> finalizeQualityGateOptions,
    IOptions<ExplainGovernanceBlocksOptions> explainGovernanceBlocksOptions,
    ILogger<FinalizeReadinessService> logger) : IFinalizeReadinessService
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IAgentTaskRepository _taskRepository =
        taskRepository ?? throw new ArgumentNullException(nameof(taskRepository));

    private readonly IArchitectureRequestRepository _architectureRequestRepository =
        architectureRequestRepository ?? throw new ArgumentNullException(nameof(architectureRequestRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly IFindingReviewTrailRepository _findingReviewTrailRepository =
        findingReviewTrailRepository ?? throw new ArgumentNullException(nameof(findingReviewTrailRepository));

    private readonly IAgentExecutionTraceRepository _agentExecutionTraceRepository =
        agentExecutionTraceRepository ?? throw new ArgumentNullException(nameof(agentExecutionTraceRepository));

    private readonly IRunStageOutcomesRepository _runStageOutcomesRepository =
        runStageOutcomesRepository ?? throw new ArgumentNullException(nameof(runStageOutcomesRepository));

    private readonly IAgentOutputQualityGateOptionsResolver _qualityGateOptionsResolver =
        qualityGateOptionsResolver ?? throw new ArgumentNullException(nameof(qualityGateOptionsResolver));

    private readonly IRunAssumptionAcknowledgementService _runAssumptionAcknowledgementService =
        runAssumptionAcknowledgementService ?? throw new ArgumentNullException(nameof(runAssumptionAcknowledgementService));

    private readonly IUserWorkspaceModeReader _userWorkspaceModeReader =
        userWorkspaceModeReader ?? throw new ArgumentNullException(nameof(userWorkspaceModeReader));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IPreFinalizeChecklistService _preFinalizeChecklistService =
        preFinalizeChecklistService ?? throw new ArgumentNullException(nameof(preFinalizeChecklistService));

    private readonly IPreCommitGovernanceGate _preCommitGovernanceGate =
        preCommitGovernanceGate ?? throw new ArgumentNullException(nameof(preCommitGovernanceGate));

    private readonly IRunPolicyPackPinService _runPolicyPackPinService =
        runPolicyPackPinService ?? throw new ArgumentNullException(nameof(runPolicyPackPinService));

    private readonly IRunEvidencePackagePinService _runEvidencePackagePinService =
        runEvidencePackagePinService ?? throw new ArgumentNullException(nameof(runEvidencePackagePinService));

    private readonly IArchitectureKnowledgeModelAccess _architectureKnowledgeModelAccess =
        architectureKnowledgeModelAccess ?? throw new ArgumentNullException(nameof(architectureKnowledgeModelAccess));

    private readonly IDraftRequestRepository _draftRequestRepository =
        draftRequestRepository ?? throw new ArgumentNullException(nameof(draftRequestRepository));

    private readonly IArchitectureVersionRepository _architectureVersionRepository =
        architectureVersionRepository ?? throw new ArgumentNullException(nameof(architectureVersionRepository));

    private readonly IPreCommitGovernanceBlockExplainer _preCommitGovernanceBlockExplainer =
        preCommitGovernanceBlockExplainer ?? throw new ArgumentNullException(nameof(preCommitGovernanceBlockExplainer));

    private readonly IOptions<PreCommitGovernanceGateOptions> _preCommitGovernanceGateOptions =
        preCommitGovernanceGateOptions ?? throw new ArgumentNullException(nameof(preCommitGovernanceGateOptions));

    private readonly IOptions<FinalizeQualityGateOptions> _finalizeQualityGateOptions =
        finalizeQualityGateOptions ?? throw new ArgumentNullException(nameof(finalizeQualityGateOptions));

    private readonly IOptions<ExplainGovernanceBlocksOptions> _explainGovernanceBlocksOptions =
        explainGovernanceBlocksOptions ?? throw new ArgumentNullException(nameof(explainGovernanceBlocksOptions));

    private readonly ILogger<FinalizeReadinessService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<FinalizeReadinessResult> BuildAsync(
        string runId,
        IReadOnlyList<string>? requestAcknowledgedAssumptionIds = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        FinalizeQualityGateOptions gateOptions = _finalizeQualityGateOptions.Value ?? new FinalizeQualityGateOptions();
        PreFinalizeChecklistResult checklist =
            await _preFinalizeChecklistService.BuildAsync(runId, cancellationToken).ConfigureAwait(false);

        if (!Guid.TryParse(runId, out Guid runKey))
        {
            return BuildResult(runId, [], FinalizeQualityScorecardCounts.Empty, [], gateOptions.Enabled, checklist);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? runRecord = await _runRepository.GetByIdAsync(scope, runKey, cancellationToken).ConfigureAwait(false);

        if (runRecord is null)
        {
            return BuildResult(runId, [], FinalizeQualityScorecardCounts.Empty, [], gateOptions.Enabled, checklist);
        }

        if (runRecord.GoldenManifestId is not null)
        {
            List<FinalizeReadinessBlock> committedBlocks =
            [
                new()
                {
                    Code = "run_already_committed",
                    Layer = FinalizeReadinessLayers.Integrity,
                    Message = "This review is already finalized.",
                },
            ];

            return BuildResult(
                runId,
                committedBlocks,
                FinalizeQualityScorecardCounts.Empty,
                [],
                gateOptions.Enabled,
                checklist);
        }

        ArchitectureRun? architectureRun = await ArchitectureRunAuthorityReader
            .TryGetArchitectureRunFromRecordAsync(
                _scopeContextProvider,
                _taskRepository,
                runId,
                runRecord,
                cancellationToken)
            .ConfigureAwait(false);

        if (architectureRun is null)
        {
            return BuildResult(runId, [], FinalizeQualityScorecardCounts.Empty, [], gateOptions.Enabled, checklist);
        }

        if (string.IsNullOrWhiteSpace(runRecord.ArchitectureRequestId))
        {
            return BuildResult(runId, [], FinalizeQualityScorecardCounts.Empty, [], gateOptions.Enabled, checklist);
        }

        ArchitectureRequest? request = await _architectureRequestRepository
            .GetByIdAsync(runRecord.ArchitectureRequestId, cancellationToken)
            .ConfigureAwait(false);

        if (request is null)
        {
            return BuildResult(runId, [], FinalizeQualityScorecardCounts.Empty, [], gateOptions.Enabled, checklist);
        }

        FindingsSnapshot findings = await LoadFindingsAsync(scope, runId, runRecord, cancellationToken)
            .ConfigureAwait(false);

        bool workingDesk = await _userWorkspaceModeReader
            .IsWorkingDeskAsync(_actorContext.GetActor(), cancellationToken)
            .ConfigureAwait(false);

        (bool degradedFindingCoverage, RunFindingCoverageSummary? coverageSummary) =
            RunFindingCoverageProjection.Build(findings);

        IReadOnlyList<string> degradedLabels = coverageSummary?.FailedEngineLabels ?? [];

        List<FinalizeReadinessBlock> blocks = [];

        AppendCareerArtifactBlocks(
            blocks,
            request.IntakeTransparencyTrail,
            coverageSummary?.EnginesSucceeded,
            workingDesk,
            architectureRun.StructuralExecutionMode,
            degradedFindingCoverage,
            degradedLabels);

        await AppendPreScorecardIntegrityBlocksAsync(
            blocks,
            architectureRun,
            runRecord,
            runId,
            runKey,
            request,
            findings,
            requestAcknowledgedAssumptionIds,
            cancellationToken).ConfigureAwait(false);

        FinalizeQualityScorecardCounts scorecardCounts = FinalizeQualityScorecardCounts.Empty;
        IReadOnlyList<string> scorecardReasons = [];

        if (gateOptions.Enabled)
        {
            IReadOnlyDictionary<string, Disposition> latestDispositions =
                await PreFinalizeLatestDispositionLoader
                    .LoadAsync(_findingReviewTrailRepository, scope, findings.Findings, cancellationToken)
                    .ConfigureAwait(false);

            scorecardCounts = FinalizeQualityScorecardEvaluator.Compute(
                request,
                findings,
                latestDispositions,
                gateOptions);

            scorecardReasons = FinalizeQualityScorecardEvaluator.GetBlockingReasons(scorecardCounts, gateOptions);

            foreach (string reason in scorecardReasons)
            {
                blocks.Add(new FinalizeReadinessBlock
                {
                    Code = "scorecard",
                    Layer = FinalizeReadinessLayers.Scorecard,
                    Message = reason,
                });
            }
        }

        AppendEvidenceReferentialIntegrityBlock(blocks, runRecord, findings);

        await AppendPreCommitGovernanceBlocksAsync(blocks, runId, cancellationToken).ConfigureAwait(false);

        return BuildResult(runId, blocks, scorecardCounts, scorecardReasons, gateOptions.Enabled, checklist);
    }

    /// <summary>
    ///     Embedded checklist on the readiness contract follows commit authority so finalize UI does not
    ///     disagree with <see cref="FinalizeReadinessResult.ReadyToFinalize" /> on the same payload.
    ///     Standalone <c>GET …/pre-finalize/checklist</c> keeps its own operator-hygiene ready flag.
    /// </summary>
    internal static PreFinalizeChecklistResult AlignChecklistWithCommitAuthority(
        PreFinalizeChecklistResult checklist,
        bool commitAuthorityReady)
    {
        ArgumentNullException.ThrowIfNull(checklist);

        if (checklist.ReadyToFinalize == commitAuthorityReady)
            return checklist;

        return new PreFinalizeChecklistResult
        {
            RunId = checklist.RunId,
            ReadyToFinalize = commitAuthorityReady,
            Items = checklist.Items,
            AdvisoryCount = checklist.AdvisoryCount,
            BlockingCount = checklist.BlockingCount,
            PreCommitGateEnabled = checklist.PreCommitGateEnabled,
        };
    }

    private static void AppendCareerArtifactBlocks(
        List<FinalizeReadinessBlock> blocks,
        TransparencyTrail? transparencyTrail,
        int? enginesSucceeded,
        bool workingDesk,
        StructuralExecutionMode structuralExecutionMode,
        bool degradedFindingCoverage,
        IReadOnlyList<string> degradedFindingCoverageFailedEngineLabels)
    {
        CareerArtifactCompletenessInput input = CareerArtifactCompletenessInputMapper.MapForFinalize(
            transparencyTrail,
            enginesSucceeded,
            workingDesk,
            preCommitGateEnabled: true,
            structuralExecutionMode,
            degradedFindingCoverage,
            degradedFindingCoverageFailedEngineLabels);

        CareerArtifactCompletenessResult result = new CareerArtifactCompletenessValidator().Evaluate(input);

        foreach (CareerArtifactBlockReason blockReason in result.BlockReasons)
        {
            blocks.Add(new FinalizeReadinessBlock
            {
                Code = blockReason.Code,
                Layer = FinalizeReadinessLayers.CareerArtifact,
                Message = blockReason.Message,
            });
        }
    }

    private async Task AppendPreCommitGovernanceBlocksAsync(
        List<FinalizeReadinessBlock> blocks,
        string runId,
        CancellationToken cancellationToken)
    {
        if (!_preCommitGovernanceGateOptions.Value.PreCommitGateEnabled)
            return;

        PreCommitGateResult gateResult =
            await _preCommitGovernanceGate.EvaluateAsync(runId, cancellationToken).ConfigureAwait(false);

        if (!gateResult.Blocked || gateResult.WarnOnly)
            return;

        string? blockExplanation = await PreCommitGovernanceBlockExplanationAttacher.TryExplainAsync(
            _preCommitGovernanceBlockExplainer,
            _explainGovernanceBlocksOptions,
            _logger,
            runId,
            gateResult,
            PreCommitGovernanceBlockExplanationAttacher.BuildReadinessGateContextExcerpt(gateResult),
            cancellationToken).ConfigureAwait(false);

        blocks.Add(new FinalizeReadinessBlock
        {
            Code = "pre_commit_gate",
            Layer = FinalizeReadinessLayers.Governance,
            Message = gateResult.Reason ?? "Policy pack thresholds would block finalize.",
            BlockExplanation = blockExplanation,
        });
    }

    private async Task AppendPreScorecardIntegrityBlocksAsync(
        List<FinalizeReadinessBlock> blocks,
        ArchitectureRun architectureRun,
        RunRecord runRecord,
        string runId,
        Guid runGuid,
        ArchitectureRequest request,
        FindingsSnapshot findings,
        IReadOnlyList<string>? requestAcknowledgedAssumptionIds,
        CancellationToken cancellationToken)
    {
        foreach (string reason in StructuralExecutionModeCommitGuard.GetBlockingReasons(architectureRun.StructuralExecutionMode))
        {
            blocks.Add(new FinalizeReadinessBlock
            {
                Code = "structural_execution_mode",
                Layer = FinalizeReadinessLayers.Integrity,
                Message = "Commit blocked: structural execution mode is not decision-grade. " + reason,
            });
        }

        IReadOnlyList<StageTimelineSummary> stageOutcomes =
            await _runStageOutcomesRepository.ListByRunIdAsync(runGuid, cancellationToken).ConfigureAwait(false);

        AuthorityRunLifecyclePhase phase = AuthorityRunLifecyclePhaseResolver.Resolve(
            architectureRun.GoldenManifestId,
            null,
            stageOutcomes);

        if (phase != AuthorityRunLifecyclePhase.Complete)
        {
            blocks.Add(new FinalizeReadinessBlock
            {
                Code = "lifecycle_phase_incomplete",
                Layer = FinalizeReadinessLayers.Integrity,
                Message =
                    $"Commit blocked: authority lifecycle phase is {phase}; pipeline must be Complete before seal.",
            });
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IReadOnlyList<string> architectureVersionPinReasons =
            await CommitArchitectureVersionPinIntegrityEvaluator.GetBlockingReasonsAsync(
                scope,
                runId,
                request,
                _runRepository,
                _architectureVersionRepository,
                _architectureKnowledgeModelAccess,
                cancellationToken)
            .ConfigureAwait(false);

        foreach (string reason in architectureVersionPinReasons)
        {
            blocks.Add(new FinalizeReadinessBlock
            {
                Code = "architecture_version_pin",
                Layer = FinalizeReadinessLayers.Integrity,
                Message = reason,
            });
        }

        IReadOnlyList<string> createTimePinReasons =
            await CommitCreateTimePinIntegrityEvaluator.GetBlockingReasonsAsync(
                scope,
                runId,
                runRecord,
                _runPolicyPackPinService,
                _runEvidencePackagePinService,
                _draftRequestRepository,
                cancellationToken)
            .ConfigureAwait(false);

        foreach (string reason in createTimePinReasons)
        {
            blocks.Add(new FinalizeReadinessBlock
            {
                Code = "create_time_pin_integrity",
                Layer = FinalizeReadinessLayers.Integrity,
                Message = reason,
            });
        }

        IReadOnlyList<AgentExecutionTrace> traces =
            await _agentExecutionTraceRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        AgentOutputQualityGateOptions qualityOptions = _qualityGateOptionsResolver.Resolve(cancellationToken);

        foreach (string reason in RealCommitAgentOutputQualityGateEvaluator.GetBlockingReasons(
                     architectureRun,
                     qualityOptions,
                     traces))
        {
            blocks.Add(new FinalizeReadinessBlock
            {
                Code = "agent_output_quality",
                Layer = FinalizeReadinessLayers.Integrity,
                Message = "Commit blocked: agent output quality gate rejected one or more traces. " + reason,
            });
        }

        foreach (string reason in UnsupportedSemanticSupportFinalizeHoldEvaluator.GetBlockingReasons(
                     architectureRun,
                     qualityOptions,
                     findings.Findings))
        {
            blocks.Add(new FinalizeReadinessBlock
            {
                Code = "unsupported_semantic_support",
                Layer = FinalizeReadinessLayers.Integrity,
                Message = reason,
            });
        }

        IReadOnlyList<string> provenanceViolations = DecisionGradeFindingProvenanceValidator.GetViolations(findings);

        if (provenanceViolations.Count > 0)
        {
            blocks.Add(new FinalizeReadinessBlock
            {
                Code = "decision_grade_provenance",
                Layer = FinalizeReadinessLayers.Integrity,
                Message =
                    "Commit blocked: one or more findings lack decision-grade provenance. "
                    + string.Join(" ", provenanceViolations),
            });
        }

        HashSet<string> acknowledgedIds = await LoadAcknowledgedAssumptionIdsAsync(
            scope,
            runGuid,
            requestAcknowledgedAssumptionIds,
            cancellationToken).ConfigureAwait(false);

        foreach (string reason in FinalizeAssumptionGateEvaluator.GetBlockingReasons(
                     request,
                     findings,
                     acknowledgedIds))
        {
            blocks.Add(new FinalizeReadinessBlock
            {
                Code = "existential_assumption",
                Layer = FinalizeReadinessLayers.Integrity,
                Message =
                    "Commit blocked: existential assumptions require confirmation before finalize. "
                    + reason,
            });
        }

        IReadOnlyList<string> evidenceIntegrityReasons =
            FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons(runRecord, findings.Findings);

        if (evidenceIntegrityReasons.Count > 0)
        {
            blocks.Add(new FinalizeReadinessBlock
            {
                Code = "evidence_referential_integrity",
                Layer = FinalizeReadinessLayers.Integrity,
                Message =
                    "Commit blocked: finding evidence referential integrity failed. "
                    + string.Join(" ", evidenceIntegrityReasons),
            });
        }
    }

    private static void AppendEvidenceReferentialIntegrityBlock(
        List<FinalizeReadinessBlock> blocks,
        RunRecord runRecord,
        FindingsSnapshot findings)
    {
        IReadOnlyList<string> evidenceIntegrityReasons =
            FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons(runRecord, findings.Findings);

        if (evidenceIntegrityReasons.Count == 0)
            return;

        blocks.Add(new FinalizeReadinessBlock
        {
            Code = "evidence_referential_integrity",
            Layer = FinalizeReadinessLayers.Integrity,
            Message =
                "Commit blocked: finding evidence referential integrity failed. "
                + string.Join(" ", evidenceIntegrityReasons),
        });
    }

    private static void AppendEvidenceReferentialIntegrityBlock(
        List<FinalizeReadinessBlock> blocks,
        RunRecord runRecord,
        FindingsSnapshot findings)
    {
        IReadOnlyList<string> evidenceIntegrityReasons =
            FindingEvidenceReferentialIntegrityValidator.GetBlockingReasons(runRecord, findings.Findings);

        if (evidenceIntegrityReasons.Count == 0)
            return;

        blocks.Add(new FinalizeReadinessBlock
        {
            Code = "evidence_referential_integrity",
            Layer = FinalizeReadinessLayers.Integrity,
            Message =
                "Commit blocked: finding evidence referential integrity failed. "
                + string.Join(" ", evidenceIntegrityReasons),
        });
    }

    private async Task<HashSet<string>> LoadAcknowledgedAssumptionIdsAsync(
        ScopeContext scope,
        Guid runGuid,
        IReadOnlyList<string>? requestAcknowledgedIds,
        CancellationToken cancellationToken)
    {
        HashSet<string> acknowledgedIds = RunAssumptionAcknowledgementJson.NormalizeIds(requestAcknowledgedIds);

        IReadOnlySet<string> persistedIds = await _runAssumptionAcknowledgementService
            .GetAcknowledgedIdsAsync(scope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        acknowledgedIds.UnionWith(persistedIds);

        return acknowledgedIds;
    }

    private async Task<FindingsSnapshot> LoadFindingsAsync(
        ScopeContext scope,
        string runId,
        RunRecord run,
        CancellationToken cancellationToken)
    {
        if (run.FindingsSnapshotId is not Guid snapshotId)
            return new FindingsSnapshot();

        FindingsSnapshot? snapshot = await _findingsSnapshotRepository
            .GetByIdAsync(scope, snapshotId, cancellationToken)
            .ConfigureAwait(false);

        return snapshot ?? new FindingsSnapshot();
    }

    private static FinalizeReadinessResult BuildResult(
        string runId,
        IReadOnlyList<FinalizeReadinessBlock> blocks,
        FinalizeQualityScorecardCounts scorecardCounts,
        IReadOnlyList<string> scorecardBlockingReasons,
        bool finalizeQualityGateEnabled,
        PreFinalizeChecklistResult checklist)
    {
        string? summary = blocks.Count > 0
            ? string.Join(" ", blocks.Select(static block => block.Message))
            : null;

        PreFinalizeChecklistResult alignedChecklist =
            AlignChecklistWithCommitAuthority(checklist, commitAuthorityReady: blocks.Count == 0);

        return new FinalizeReadinessResult
        {
            RunId = runId,
            ReadyToFinalize = blocks.Count == 0,
            BlockedReasonSummary = summary,
            Blocks = blocks,
            Checklist = alignedChecklist,
            Scorecard = MapScorecard(scorecardCounts),
            ScorecardBlockingReasons = scorecardBlockingReasons,
            FinalizeQualityGateEnabled = finalizeQualityGateEnabled,
        };
    }

    private static FinalizeQualityScorecardCountsDto MapScorecard(FinalizeQualityScorecardCounts counts)
    {
        return new FinalizeQualityScorecardCountsDto
        {
            BlockingFindingCount = counts.BlockingFindingCount,
            UncoveredMandatoryRequirementCount = counts.UncoveredMandatoryRequirementCount,
            OpenDeferredCount = counts.OpenDeferredCount,
            OpenContradictionCount = counts.OpenContradictionCount,
            OpenCannotDetermineCount = counts.OpenCannotDetermineCount,
            OpenVerifyHypothesisCount = counts.OpenVerifyHypothesisCount,
            UnverifiedAssumptionCount = counts.UnverifiedAssumptionCount,
            LowExtractionConfidenceCount = counts.LowExtractionConfidenceCount,
            UnresolvedHighSeverityDispositionCount = counts.UnresolvedHighSeverityDispositionCount,
        };
    }
}
