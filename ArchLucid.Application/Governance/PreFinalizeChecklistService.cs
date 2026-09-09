using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

public sealed partial class PreFinalizeChecklistService(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IArchitectureRequestRepository architectureRequestRepository,
    IFindingsSnapshotRepository findingsSnapshotRepository,
    ITechnologyLedgerRepository technologyLedgerRepository,
    ITechnologyConsistencyFindingEngine technologyConsistencyFindingEngine,
    IOptions<TechnologyConsistencyFindingEngineOptions> technologyConsistencyFindingEngineOptions,
    IFindingEvidenceLinkageFindingEngine findingEvidenceLinkageFindingEngine,
    IOptions<FindingEvidenceLinkageFindingEngineOptions> findingEvidenceLinkageFindingEngineOptions,
    IPreCommitGovernanceGate preCommitGovernanceGate,
    IOptions<PreCommitGovernanceGateOptions> preCommitGovernanceGateOptions,
    PreFinalizeExecuteBaselineDriftEvaluator executeBaselineDriftEvaluator,
    IFindingReviewTrailRepository findingReviewTrailRepository,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess = null,
    IArchitectureIntelligenceFinalizeTrustEvaluator? finalizeTrustEvaluator = null,
    IBlockedReviewCheckProjector? blockedReviewCheckProjector = null,
    ISpecialistReviewService? specialistReviewService = null,
    TimeProvider? timeProvider = null) : IPreFinalizeChecklistService
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRequestRepository _architectureRequestRepository =
        architectureRequestRepository ?? throw new ArgumentNullException(nameof(architectureRequestRepository));

    private readonly IFindingsSnapshotRepository _findingsSnapshotRepository =
        findingsSnapshotRepository ?? throw new ArgumentNullException(nameof(findingsSnapshotRepository));

    private readonly ITechnologyLedgerRepository _technologyLedgerRepository =
        technologyLedgerRepository ?? throw new ArgumentNullException(nameof(technologyLedgerRepository));

    private readonly ITechnologyConsistencyFindingEngine _technologyConsistencyFindingEngine =
        technologyConsistencyFindingEngine ?? throw new ArgumentNullException(nameof(technologyConsistencyFindingEngine));

    private readonly IOptions<TechnologyConsistencyFindingEngineOptions> _technologyConsistencyFindingEngineOptions =
        technologyConsistencyFindingEngineOptions
        ?? throw new ArgumentNullException(nameof(technologyConsistencyFindingEngineOptions));

    private readonly IFindingEvidenceLinkageFindingEngine _findingEvidenceLinkageFindingEngine =
        findingEvidenceLinkageFindingEngine ?? throw new ArgumentNullException(nameof(findingEvidenceLinkageFindingEngine));

    private readonly IOptions<FindingEvidenceLinkageFindingEngineOptions> _findingEvidenceLinkageFindingEngineOptions =
        findingEvidenceLinkageFindingEngineOptions
        ?? throw new ArgumentNullException(nameof(findingEvidenceLinkageFindingEngineOptions));

    private readonly IPreCommitGovernanceGate _preCommitGovernanceGate =
        preCommitGovernanceGate ?? throw new ArgumentNullException(nameof(preCommitGovernanceGate));

    private readonly IOptions<PreCommitGovernanceGateOptions> _preCommitGovernanceGateOptions =
        preCommitGovernanceGateOptions ?? throw new ArgumentNullException(nameof(preCommitGovernanceGateOptions));

    private readonly PreFinalizeExecuteBaselineDriftEvaluator _executeBaselineDriftEvaluator =
        executeBaselineDriftEvaluator ?? throw new ArgumentNullException(nameof(executeBaselineDriftEvaluator));

    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

    private readonly IArchitectureIntelligenceFinalizeTrustEvaluator? _finalizeTrustEvaluator =
        finalizeTrustEvaluator;

    private readonly IBlockedReviewCheckProjector? _blockedReviewCheckProjector = blockedReviewCheckProjector;

    private readonly ISpecialistReviewService? _specialistReviewService = specialistReviewService;

    private readonly TimeProvider _timeProvider = timeProvider ?? TimeProvider.System;

    public async Task<PreFinalizeChecklistResult> BuildAsync(string runId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid runKey))
        {
            return EmptyResult(runId);
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runKey, cancellationToken).ConfigureAwait(false);

        if (run is null)
        {
            return MissingRunResult(runId);
        }

        List<PreFinalizeChecklistItem> items = [];

        IReadOnlyList<TechnologyLedgerEntry> ledgerEntries =
            await _technologyLedgerRepository.GetByRunIdAsync(scope, runId, cancellationToken).ConfigureAwait(false);

        int assumedTechnologyCount = ledgerEntries.Count(entry => entry.Status == TechnologyLedgerStatus.Assumed);
        items.Add(BuildAssumedTechnologyItem(assumedTechnologyCount));

        List<Finding> findings = await LoadFindingsAsync(scope, runId, run, cancellationToken).ConfigureAwait(false);
        IReadOnlyDictionary<string, ArchLucid.Contracts.Findings.FindingDisposition> latestDispositions =
            await LoadLatestDispositionsAsync(scope, findings, cancellationToken).ConfigureAwait(false);
        int criticalCount = PreFinalizeActiveFindingCounter.Count(findings, FindingSeverity.Critical, latestDispositions);
        int errorCount = PreFinalizeActiveFindingCounter.Count(findings, FindingSeverity.Error, latestDispositions);

        items.Add(BuildSeverityItem(
            "open-critical-findings",
            "Critical findings resolved",
            "Unresolved critical findings",
            criticalCount,
            FindingSeverity.Critical));

        items.Add(BuildSeverityItem(
            "open-error-findings",
            "Error-severity findings reviewed",
            "Unresolved error-severity findings remain",
            errorCount,
            FindingSeverity.Error,
            blocking: false));

        items.Add(BuildEvidenceLinkageItem(runId, findings, latestDispositions));

        PreCommitGateResult gateResult =
            await _preCommitGovernanceGate.EvaluateAsync(runId, cancellationToken).ConfigureAwait(false);

        if (_blockedReviewCheckProjector is not null)
        {
            await _blockedReviewCheckProjector
                .ProjectBlockedChecksAsync(scope, runId, gateResult, cancellationToken)
                .ConfigureAwait(false);
        }

        items.Add(await BuildProvisionalSynthesisItemAsync(scope, runId, cancellationToken).ConfigureAwait(false));

        bool preCommitGateEnabled = _preCommitGovernanceGateOptions.Value.PreCommitGateEnabled;
        items.Add(BuildPreCommitGateItem(gateResult, preCommitGateEnabled));

        items.AddRange(
            await BuildExecuteBaselineDriftItemsAsync(scope, run, cancellationToken).ConfigureAwait(false));

        await AddArchitectureIntelligenceTrustItemsAsync(scope, runId, items, cancellationToken).ConfigureAwait(false);

        items.Add(await BuildPolicyPackCoverageProofItemAsync(scope, runKey, cancellationToken).ConfigureAwait(false));

        int advisoryCount = items.Count(item => item.Status == PreFinalizeChecklistItemStatus.Advisory);
        int blockingCount = items.Count(item => item.Status == PreFinalizeChecklistItemStatus.Blocking);

        return new PreFinalizeChecklistResult
        {
            RunId = runId,
            ReadyToFinalize = blockingCount == 0,
            Items = items,
            AdvisoryCount = advisoryCount,
            BlockingCount = blockingCount,
            PreCommitGateEnabled = preCommitGateEnabled,
        };
    }

    private Task<List<Finding>> LoadFindingsAsync(
        ScopeContext scope,
        string runId,
        RunRecord run,
        CancellationToken cancellationToken)
    {
        return PreFinalizeGateParityFindingLoader.LoadAsync(
            runId,
            scope,
            run,
            _findingsSnapshotRepository,
            _technologyLedgerRepository,
            _technologyConsistencyFindingEngine,
            _technologyConsistencyFindingEngineOptions.Value,
            _findingEvidenceLinkageFindingEngine,
            _findingEvidenceLinkageFindingEngineOptions.Value,
            cancellationToken);
    }

    private async Task<FindingsSnapshot?> LoadFindingsSnapshotAsync(
        ScopeContext scope,
        Guid runKey,
        CancellationToken cancellationToken)
    {
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runKey, cancellationToken).ConfigureAwait(false);

        if (run?.FindingsSnapshotId is not Guid snapshotId)
            return null;

        return await _findingsSnapshotRepository.GetByIdAsync(scope, snapshotId, cancellationToken).ConfigureAwait(false);
    }

    private static PreFinalizeChecklistResult EmptyResult(string runId) =>
        new()
        {
            RunId = runId,
            ReadyToFinalize = false,
            Items = [],
        };

    private static PreFinalizeChecklistResult MissingRunResult(string runId) =>
        new()
        {
            RunId = runId,
            ReadyToFinalize = false,
            Items =
            [
                new PreFinalizeChecklistItem
                {
                    ItemId = "run-scope",
                    Title = "Run in scope",
                    Detail = "Run was not found in the current workspace/project scope.",
                    Status = PreFinalizeChecklistItemStatus.Blocking,
                    Count = 1,
                },
            ],
            BlockingCount = 1,
        };

    private async Task<IReadOnlyList<PreFinalizeChecklistItem>> BuildExecuteBaselineDriftItemsAsync(
        ScopeContext scope,
        RunRecord run,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(run.ArchitectureRequestId))
            return [];

        ArchitectureRequest? request =
            await _architectureRequestRepository
                .GetByIdAsync(run.ArchitectureRequestId, cancellationToken)
                .ConfigureAwait(false);

        if (request is null)
        {
            if (string.IsNullOrWhiteSpace(run.GovernanceScopeJson))
                return [];

            return
            [
                new PreFinalizeChecklistItem
                {
                    ItemId = "architecture-request-missing",
                    Title = "Architecture request available for execute-baseline review",
                    Detail =
                        "Run references an architecture request that could not be loaded. Re-run execute or remediate data consistency before finalize.",
                    Status = PreFinalizeChecklistItemStatus.Blocking,
                    Count = 1,
                },
            ];
        }

        return await _executeBaselineDriftEvaluator
            .EvaluateAsync(scope, request, run.GovernanceScopeJson, cancellationToken)
            .ConfigureAwait(false);
    }
}
